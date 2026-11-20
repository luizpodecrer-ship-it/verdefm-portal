"""
Coleta o conteúdo de DEMONSTRAÇÃO do portal a partir dos sites atuais da Verde FM.
Só serve para a versão de conferência no Netlify: no WordPress o conteúdo vem do próprio banco.

Uso:  python3 ferramentas/coletar-demo.py PASTA_COM_OS_JSON
      (na pasta: www.verdefm.com.br.json, www.verdefmjaciara.com.br.json,
       www.verdefmcampoverde.com.br.json, cat-*.json, cat13.json, prog*.html, feed.xml —
       baixados da API pública /wp-json/wp/v2/posts?_embed, das páginas /programacao/ e do feed do YouTube)
Saída: ferramentas/dados/demo.json
"""
import glob
import html
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

ORIGEM = sys.argv[1]
SAIDA = os.path.join(os.path.dirname(__file__), 'dados', 'demo.json')

SITES = {
    'www.verdefm.com.br.json': 'cuiaba',
    'www.verdefmjaciara.com.br.json': 'jaciara',
    'www.verdefmcampoverde.com.br.json': 'campo-verde',
}

# Editoria principal de cada matéria (ordem de prioridade) -> slug da página de editoria
EDITORIAS = [
    ('Policial', 'policial', 'Policial'),
    ('Política', 'politica', 'Política'),
    ('Economia e Negócios', 'economia', 'Economia e negócios'),
    ('Esporte e Cultura', 'esporte-e-cultura', 'Esporte e cultura'),
    ('Entretenimento', 'esporte-e-cultura', 'Esporte e cultura'),
    ('Brasil', 'brasil', 'Brasil'),
    ('Cidades', 'cidades', 'Cidades'),
]


class Limpador(HTMLParser):
    """Deixa só o HTML de texto da matéria (sem scripts, anúncios, estilos e atributos soltos)."""
    PERMITIDAS = {'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'strong', 'b', 'em', 'i', 'a', 'img',
                  'figure', 'figcaption', 'br', 'iframe'}
    DESCARTA_TUDO = {'script', 'style', 'noscript', 'form', 'svg', 'button', 'template', 'select', 'textarea'}
    VAZIAS = {'img', 'br', 'source', 'input', 'hr', 'meta', 'link', 'wbr'}
    CLASSE_RUIM = re.compile(r'criativa|(^|[\s_-])ads?([\s_-]|$)|banner|sharedaddy|jp-relatedposts|addtoany|share', re.I)

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.saida = []
        self.pular = 0  # profundidade dentro de um bloco descartado

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if self.pular:
            if tag not in self.VAZIAS:
                self.pular += 1
            return
        if tag in self.DESCARTA_TUDO or self.CLASSE_RUIM.search(a.get('class') or '') or self.CLASSE_RUIM.search(a.get('id') or ''):
            if tag not in self.VAZIAS:
                self.pular = 1
            return
        if tag == 'h1':
            tag = 'h2'
        if tag not in self.PERMITIDAS:
            return
        if tag == 'img':
            src = a.get('data-src') or a.get('data-lazy-src') or a.get('data-vf-src') or a.get('src') or ''
            if not src or src.startswith('data:'):
                return
            self.saida.append('<img src="%s" alt="%s" loading="lazy">' % (html.escape(src), html.escape(a.get('alt') or '')))
            return
        if tag == 'iframe':
            src = a.get('data-src') or a.get('src') or ''
            if 'youtube.com/embed/' in src or 'youtube-nocookie.com/embed/' in src:
                self.saida.append('<div class="vfm-texto__video"><iframe src="%s" title="Vídeo" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>' % html.escape(src))
            self.pular = 1
            return
        if tag == 'a':
            href = a.get('href') or ''
            if not href or href.startswith('javascript'):
                self.saida.append('<a>')
                return
            self.saida.append('<a href="%s" target="_blank" rel="noopener">' % html.escape(href))
            return
        self.saida.append('<%s>' % tag)

    def handle_endtag(self, tag):
        if self.pular:
            self.pular -= 1
            return
        if tag == 'h1':
            tag = 'h2'
        if tag in self.PERMITIDAS and tag not in self.VAZIAS and tag != 'iframe':
            self.saida.append('</%s>' % tag)

    def handle_data(self, data):
        if not self.pular:
            self.saida.append(html.escape(data, quote=False))

    def resultado(self):
        s = ''.join(self.saida)
        s = s.replace('<a>', '').replace('</a>', '</a>')
        s = re.sub(r'<p>\s*(&nbsp;|\xa0)?\s*</p>', '', s)
        s = re.sub(r'<(strong|b|em|i)>\s*</\1>', '', s)
        s = re.sub(r'\n{2,}', '\n', s)
        return s.strip()


def limpar(conteudo):
    l = Limpador()
    l.feed(conteudo)
    l.close()
    return l.resultado()


def texto(h):
    return html.unescape(re.sub(r'<[^>]+>', '', h or '')).strip()


def editoria_de(cats):
    for nome, slug, rotulo in EDITORIAS:
        if nome in cats:
            return slug, rotulo
    return 'geral', 'Geral'


def tamanho(fm, *nomes):
    sizes = (fm.get('media_details') or {}).get('sizes') or {}
    for n in nomes:
        if n in sizes:
            return sizes[n]['source_url']
    return fm.get('source_url', '')


materias = {}
vistos = {}
arquivos = list(SITES) + sorted(glob.glob(os.path.join(ORIGEM, 'cat*.json')))
for arq in arquivos:
    caminho = arq if os.path.isabs(arq) else os.path.join(ORIGEM, arq)
    if not os.path.exists(caminho):
        continue
    site = SITES.get(os.path.basename(arq), 'cuiaba')
    for p in json.load(open(caminho, encoding='utf-8')):
        titulo = texto(p['title']['rendered'])
        chave = re.sub(r'\W+', '', titulo.lower())
        if chave in vistos:
            continue
        emb = p.get('_embedded') or {}
        fm = (emb.get('wp:featuredmedia') or [{}])[0] or {}
        cats = [t['name'] for g in (emb.get('wp:term') or []) for t in g if t.get('taxonomy') == 'category']
        ed, ed_rotulo = editoria_de(cats)
        slug = p['slug']
        if slug in materias:
            slug = slug + '-' + site
        vistos[chave] = slug
        # cidade: matérias dos sites de Jaciara/Campo Verde e as de "Cidades" do site de Cuiabá
        cidade = site if site != 'cuiaba' else ('cuiaba' if 'Cidades' in cats else '')
        materias[slug] = {
            'slug': slug,
            'titulo': titulo,
            'resumo': texto(p['excerpt']['rendered']).replace(' [...]', '…').replace('[…]', '…'),
            'data': p['date'],
            'link_antigo': p['link'],
            'site': site,
            'cidade': cidade,
            'categorias': cats,
            'editoria': ed,
            'editoria_rotulo': ed_rotulo,
            'foto_g': tamanho(fm, 'large', 'full', 'medium_large') if fm else '',
            'foto_m': tamanho(fm, 'medium_large', 'large', 'full', 'medium') if fm else '',
            'legenda': texto((fm.get('caption') or {}).get('rendered', '')) if fm else '',
            'conteudo': limpar(p['content']['rendered']),
        }

# ---------------------------------------------------------------- programação
DIAS = {'seg-sex': [1, 2, 3, 4, 5], 'sab-dom': [6, 0], 'sabado': [6], 'domingo': [0]}


def grade(arquivo):
    s = open(os.path.join(ORIGEM, arquivo), encoding='utf-8', errors='replace').read()
    abas = re.findall(r'<button class="sch-tab-btn[^"]*" data-tab="([^"]+)">([^<]+)</button>', s)
    blocos = []
    for aba, rotulo in abas:
        i = s.find('id="%s"' % aba)
        fim = min([x for x in [s.find('class="sch-tab-pane', i + 60), s.find('</section', i), len(s)] if x > 0])
        trecho = s[i:fim]
        itens = []
        for m in re.finditer(r'<span class="time-pill">\s*(\d{1,2})h\s*-\s*(\d{1,2})h\s*</span>.*?<h3 class="sch-title">(.*?)</h3>(.*?)(?=<div class="sch-meta">)', trecho, re.S):
            ini, fim_h, tit, resto = m.groups()
            apres = re.search(r'<p class="sch-host">(.*?)</p>', resto, re.S)
            itens.append({'inicio': int(ini), 'fim': int(fim_h), 'programa': texto(tit),
                          'apresentador': texto(apres.group(1)) if apres else ''})
        blocos.append({'rotulo': html.unescape(rotulo.strip()), 'dias': DIAS.get(aba, []), 'programas': itens})
    return blocos


grades = {
    'cuiaba': grade('prog.html'),
    'jaciara': grade('prog-verdefmjaciara.html'),
    'campo-verde': grade('prog-verdefmcampoverde.html'),
}

# ---------------------------------------------------------------- vídeos
ns = {'a': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}
videos = []
for e in ET.parse(os.path.join(ORIGEM, 'feed.xml')).getroot().findall('a:entry', ns):
    videos.append({'id': e.find('yt:videoId', ns).text, 'titulo': e.find('a:title', ns).text, 'data': e.find('a:published', ns).text[:10]})

os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
json.dump({'materias': sorted(materias.values(), key=lambda m: m['data'], reverse=True), 'grades': grades, 'videos': videos},
          open(SAIDA, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(materias), 'matérias;', {k: [len(b['programas']) for b in v] for k, v in grades.items()}, ';', len(videos), 'vídeos')
