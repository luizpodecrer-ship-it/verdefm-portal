"""
Gera as páginas internas da DEMONSTRAÇÃO (Netlify) a partir de site/index.html e ferramentas/dados/demo.json.

  python3 ferramentas/gerar-demo.py

O que faz:
  1. Ajusta a home: links das matérias passam a abrir as páginas novas (/noticia/...), menus apontam
     para as páginas internas, caminhos viram absolutos (/assets/...) e a programação vem da grade real.
  2. Usa o cabeçalho e o rodapé da home como molde de todas as páginas (no WordPress: header.php e footer.php).
  3. Cria: /noticia/*.html, /editoria/*.html, /cidade/*.html, /videos.html, /programacao.html,
     /promocoes.html, /busca.html (com /assets/demo/busca.json) e /404.html.

No WordPress nada disto é usado: cada página aqui mostra o HTML que o template correspondente deve gerar
(single.php, category.php, taxonomy-cidade.php, page-videos.php, page-programacao.php, page-promocoes.php,
search.php e 404.php). Rodar de novo é seguro: o resultado é sempre o mesmo.
"""
import html
import json
import os
import re
from datetime import datetime
from urllib.parse import quote

AQUI = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(AQUI, '..', 'site')
D = json.load(open(os.path.join(AQUI, 'dados', 'demo.json'), encoding='utf-8'))
ENDERECO = 'https://verdefm-portal.netlify.app'  # WP: home_url()

e = lambda t: html.escape(t or '', quote=True)
MATERIAS = D['materias']
POR_SLUG = {m['slug']: m for m in MATERIAS}
POR_LINK = {m['link_antigo']: m for m in MATERIAS}
FOTO_VAZIA = '/assets/img/sem-foto.svg'  # matéria sem foto: fundo verde-claro com o símbolo de rádio

CIDADES = [
    {'slug': 'cuiaba', 'nome': 'Cuiabá', 'frequencia': '103.7', 'stream': 'https://streaming.livespanel.com:20086/verdefm', 'ativa': True},
    {'slug': 'campo-verde', 'nome': 'Campo Verde', 'frequencia': '96.3', 'stream': 'https://str1.streamhostpg.com.br:8062/stream', 'ativa': True},
    {'slug': 'jaciara', 'nome': 'Jaciara', 'frequencia': '102.3', 'stream': 'https://streaming.livespanel.com:20120/verdefmjaciara', 'ativa': True},
    {'slug': 'arenapolis', 'nome': 'Arenápolis', 'frequencia': '102.1', 'stream': '', 'ativa': False},
]
EDITORIAS = {
    'politica': ('Política', 'Política de Cuiabá, de Mato Grosso e do Brasil: Assembleia, prefeituras, Câmara e governo.'),
    'economia': ('Economia e negócios', 'Emprego, contas, comércio, agro e o que mexe com o bolso de quem vive em Mato Grosso.'),
    'esporte-e-cultura': ('Esporte e cultura', 'Cuiabá Esporte Clube, eventos, shows e a cultura mato-grossense.'),
    'policial': ('Policial', 'Ocorrências, operações e segurança pública em Mato Grosso.'),
    'brasil': ('Brasil', 'O que acontece no país e chega a Mato Grosso.'),
}


def ler(caminho):
    return open(os.path.join(SITE, caminho), encoding='utf-8').read()


def gravar(caminho, conteudo):
    destino = os.path.join(SITE, caminho)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    open(destino, 'w', encoding='utf-8').write(conteudo)


def data_br(iso):
    return datetime.fromisoformat(iso).strftime('%d/%m/%Y')


def data_hora(iso):
    d = datetime.fromisoformat(iso)
    return d.strftime('%d/%m/%Y às %Hh%M')


def fina(t, limite=200):
    """Linha fina curta: a primeira frase (ou um corte limpo), não o parágrafo inteiro."""
    t = re.sub(r'\s*(\.\.\.|…|\[…\])\s*$', '', (t or '').strip())
    for m_ in re.finditer(r'[.!?](\s|$)', t):
        if 60 <= m_.end() <= limite:
            return t[:m_.end()].strip()
        if m_.end() > limite:
            break
    return t if len(t) <= limite else t[:limite].rsplit(' ', 1)[0].rstrip(',;:') + '…'


def curto(t, limite=42):
    return t if len(t) <= limite else t[:limite].rsplit(' ', 1)[0].rstrip(',;:') + '…'


def url_materia(m):
    return '/noticia/%s.html' % m['slug']


def url_editoria(m):
    if m['editoria'] in EDITORIAS:
        return '/editoria/%s.html' % m['editoria']
    if m['editoria'] == 'cidades':
        return '/cidade/%s.html' % (m['cidade'] or 'cuiaba')
    return ''


def hora(h):
    return '%02dh' % h


# ======================================================================= 1. home
idx = ler('index.html')

troca = [
    ('href="assets/', 'href="/assets/'), ('src="assets/', 'src="/assets/'), ('"logo": "assets/', '"logo": "/assets/'),
    ('href="./"', 'href="/"'), ('action="./"', 'action="/busca.html"'),
    ('<li><a href="#editorias">Política</a></li>', '<li><a href="/editoria/politica.html">Política</a></li>'),
    ('<li><a href="#cidade">Cidades</a></li>', '<li><a href="/cidade/cuiaba.html" data-vfm-link-cidade="/cidade/{cidade}.html">Cidades</a></li>'),
    ('<li><a href="#editorias">Economia e negócios</a></li>', '<li><a href="/editoria/economia.html">Economia e negócios</a></li>'),
    ('<li><a href="#editorias">Esporte e cultura</a></li>', '<li><a href="/editoria/esporte-e-cultura.html">Esporte e cultura</a></li>'),
    ('<li><a href="#videos">Vídeos</a></li>', '<li><a href="/videos.html">Vídeos</a></li>'),
    ('<li><a href="#programacao">Programação</a></li>', '<li><a href="/programacao.html">Programação</a></li>'),
    ('<li><a href="#promocoes">Promoções</a></li>', '<li><a href="/promocoes.html">Promoções</a></li>'),
    ('class="vfm-link-mais" href="#">Todas de', 'class="vfm-link-mais" href="/cidade/cuiaba.html" data-vfm-link-cidade="/cidade/{cidade}.html">Todas de'),
    ('vfm-botao--contorno" href="#">Todas de', 'vfm-botao--contorno" href="/cidade/cuiaba.html" data-vfm-link-cidade="/cidade/{cidade}.html">Todas de'),
    ('<h2>Política</h2><a class="vfm-link-mais" href="#">', '<h2>Política</h2><a class="vfm-link-mais" href="/editoria/politica.html">'),
    ('<h2>Economia e negócios</h2><a class="vfm-link-mais" href="#">', '<h2>Economia e negócios</h2><a class="vfm-link-mais" href="/editoria/economia.html">'),
    ('<h2>Esporte e cultura</h2><a class="vfm-link-mais" href="#">', '<h2>Esporte e cultura</h2><a class="vfm-link-mais" href="/editoria/esporte-e-cultura.html">'),
    ('<a class="vfm-botao" href="#">Quero participar</a>', '<a class="vfm-botao" href="/promocoes.html">Quero participar</a>'),
    ('<a class="vfm-barra-player__link" href="#programacao">', '<a class="vfm-barra-player__link" href="/programacao.html">'),
    ('<li>Cuiabá · 103.7</li>', '<li><a href="/cidade/cuiaba.html">Cuiabá · 103.7</a></li>'),
    ('<li>Campo Verde · 96.3</li>', '<li><a href="/cidade/campo-verde.html">Campo Verde · 96.3</a></li>'),
    ('<li>Jaciara · 102.3</li>', '<li><a href="/cidade/jaciara.html">Jaciara · 102.3</a></li>'),
    ('Matérias tiradas dos sites atuais; os links abrem lá, em outra aba.', 'Matérias tiradas dos sites atuais da Verde FM (demonstração).'),
]
for a, b in troca:
    idx = idx.replace(a, b)


def link_interno(mt):
    # a mesma matéria pode ter sido publicada em mais de um site: acha pelo endereço ou pelo slug
    m = POR_LINK.get(mt.group(1)) or POR_SLUG.get(mt.group(1).rstrip('/').rsplit('/', 1)[-1])
    return 'href="%s"' % url_materia(m) if m else mt.group(0)


idx = re.sub(r'href="(https://www\.verdefm[a-z]*\.com\.br/\d{4}/\d\d/\d\d/[^"]+/)" target="_blank" rel="noopener"', link_interno, idx)

# coluna ao lado da manchete: 5 notícias (sem o cartão da rádio, que virou o player fixo)
EXTRAS_LATERAL = ['Polícia sequestra apartamento', 'Bombeiros descartam barragem']
a = idx.index('<aside class="vfm-lateral"')
b = idx.index('    </aside>', a)
for comeco in EXTRAS_LATERAL:
    if idx[a:b].count('<article class="vfm-card-linha">') >= 5:
        break
    m = next((x for x in MATERIAS if x['titulo'].startswith(comeco)), None)
    if not m or url_materia(m) in idx[a:b]:
        continue
    novo = '''      <article class="vfm-card-linha">
        <a class="vfm-card-linha__foto" href="{u}" tabindex="-1" aria-hidden="true"><img class="vfm-foto" src="{f}" alt="" width="400" height="300" loading="lazy"></a>
        <div class="vfm-card-linha__texto">
          <span class="vfm-chapeu">{ed}</span>
          <h2><a href="{u}">{t}</a></h2>
        </div>
      </article>
'''.format(u=url_materia(m), f=e(m['foto_m'] or FOTO_VAZIA), ed=e(m['editoria_rotulo']), t=e(m['titulo']))
    idx = idx[:b] + novo + idx[b:]
    b = idx.index('    </aside>', a)

# programação de hoje (home): grade real, só a cidade escolhida e o dia de hoje (o JS escolhe)
def grade_curta():
    partes = []
    for c in CIDADES:
        for b in D['grades'].get(c['slug'], []):
            itens = ''.join(
                '          <li data-inicio="%d" data-fim="%d"><time>%s</time><span><strong>%s</strong>%s</span></li>\n'
                % (p['inicio'], p['fim'], hora(p['inicio']), e(p['programa']), (' · ' + e(p['apresentador'])) if p['apresentador'] else '')
                for p in b['programas'])
            partes.append('        <ol data-vfm-grade data-vfm-grade-curta="4" data-vfm-so-cidade="%s" data-vfm-dias="%s"%s>\n%s        </ol>\n'
                          % (c['slug'], ','.join(map(str, b['dias'])), '' if c['slug'] == 'cuiaba' else ' hidden', itens))
    return ''.join(partes)


a = idx.index('      <div class="vfm-programacao" id="programacao"')
b = idx.index('      <!-- WP: promoção ativa')
idx = idx[:a] + '''      <!-- WP: grade de programas da cidade escolhida (CPT "programa" com dias, início, fim, apresentador e cidade).
           O JS mostra o dia de hoje, marca o programa no ar (vfm-no-ar) e deixa só ele e os 3 seguintes. -->
      <div class="vfm-programacao" id="programacao" data-vfm-grade-hoje>
        <h2>Programação de hoje</h2>
        <p>Verde FM <span data-vfm-texto="cidade">Cuiabá</span> · <span data-vfm-texto="frequencia">103.7</span> · <a class="vfm-link-mais" href="/programacao.html">Grade completa</a></p>
''' + grade_curta() + '      </div>\n\n' + idx[b:]

# cidades com a grade (o player mostra o programa no ar)
cidades_json = []
for c in CIDADES:
    d = dict(c)
    d['logo'] = '/assets/img/logos/%s.png' % c['slug']
    d['grade'] = D['grades'].get(c['slug'], [])
    cidades_json.append(d)
a = idx.index('<script type="application/json" id="vfm-cidades">')
b = idx.index('</script>', a)
idx = idx[:a] + '<script type="application/json" id="vfm-cidades">\n' + json.dumps(cidades_json, ensure_ascii=False) + '\n' + idx[b:]
idx = idx.replace('<!-- Cidades e rádios. WP: wp_add_inline_script ou wp_json_encode dos termos da taxonomia "cidade" -->',
                  '<!-- Cidades, rádios e grade de programação. WP: wp_json_encode dos termos da taxonomia "cidade" (+ grade do CPT "programa") -->')
gravar('index.html', idx)

# ======================================================================= 2. molde
INICIO_MAIN = '<main id="vfm-conteudo" tabindex="-1">'
ANTES = idx[:idx.index(INICIO_MAIN)]
DEPOIS = idx[idx.index('</main>') + len('</main>'):]
a = idx.index('  <!-- Banner do topo')
BANNER = idx[a:idx.index('  <!-- Destaques', a)]


def pagina(caminho, titulo, descricao, classe, corpo):
    topo = ANTES
    topo = re.sub(r'<title>.*?</title>', '<title>%s</title>' % e(titulo), topo, count=1)
    topo = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % e(descricao[:180]), topo, count=1)
    topo = topo.replace('<body class="home">', '<body class="%s">' % classe)
    topo = topo.replace('Verde FM · Home do portal', 'Verde FM · ' + titulo, 1)
    gravar(caminho, topo + INICIO_MAIN + '\n' + corpo + '\n</main>' + DEPOIS)


def trilha(*itens):
    li = ''
    for rotulo, href in itens:
        li += ('<li><a href="%s">%s</a></li>' % (href, e(rotulo))) if href else '<li><span aria-current="page">%s</span></li>' % e(rotulo)
    return '  <nav class="vfm-trilha vfm-container" aria-label="Você está em"><ol>%s</ol></nav>\n' % li


def chapeu(m):
    href = url_editoria(m)
    return ('<a class="vfm-chapeu" href="%s">%s</a>' % (href, e(m['editoria_rotulo']))) if href else '<span class="vfm-chapeu">%s</span>' % e(m['editoria_rotulo'])


def card(m, titulo_tag='h3'):
    if not m['foto_m']:  # sem foto: cartão só de texto (nada de quadro vazio)
        return '''      <li><article class="vfm-card vfm-card--sem-foto">
        <div class="vfm-meta"><span class="vfm-chapeu">{ed}</span><time datetime="{iso}">{d}</time></div>
        <{t}><a href="{u}">{tit}</a></{t}>
        <p>{res}</p>
      </article></li>
'''.format(u=url_materia(m), ed=e(m['editoria_rotulo']), iso=m['data'], d=data_br(m['data']), t=titulo_tag, tit=e(m['titulo']), res=e(fina(m['resumo'], 170)))
    return '''      <li><article class="vfm-card">
        <a class="vfm-card__foto" href="{u}" tabindex="-1" aria-hidden="true"><img src="{f}" alt="" width="768" height="480" loading="lazy"></a>
        <div class="vfm-meta"><span class="vfm-chapeu">{ed}</span><time datetime="{iso}">{d}</time></div>
        <{t}><a href="{u}">{tit}</a></{t}>
        <p>{res}</p>
      </article></li>
'''.format(u=url_materia(m), f=e(m['foto_m'] or FOTO_VAZIA), ed=e(m['editoria_rotulo']), iso=m['data'], d=data_br(m['data']),
           t=titulo_tag, tit=e(m['titulo']), res=e(fina(m['resumo'], 170)))


def destaque(m):
    if not m['foto_g']:
        return '''    <article class="vfm-destaque vfm-destaque--sem-foto">
      <div class="vfm-destaque__texto">
        <div class="vfm-meta"><span class="vfm-chapeu">{ed}</span><time datetime="{iso}">{d}</time></div>
        <h2><a href="{u}">{tit}</a></h2>
        <p>{res}</p>
      </div>
    </article>
'''.format(u=url_materia(m), ed=e(m['editoria_rotulo']), iso=m['data'], d=data_br(m['data']), tit=e(m['titulo']), res=e(fina(m['resumo'], 240)))
    return '''    <article class="vfm-destaque">
      <a class="vfm-destaque__foto" href="{u}" tabindex="-1" aria-hidden="true"><img class="vfm-foto vfm-foto--16x9" src="{f}" alt="" width="1280" height="720"></a>
      <div class="vfm-destaque__texto">
        <div class="vfm-meta"><span class="vfm-chapeu">{ed}</span><time datetime="{iso}">{d}</time></div>
        <h2><a href="{u}">{tit}</a></h2>
        <p>{res}</p>
      </div>
    </article>
'''.format(u=url_materia(m), f=e(m['foto_g'] or FOTO_VAZIA), ed=e(m['editoria_rotulo']), iso=m['data'], d=data_br(m['data']),
           tit=e(m['titulo']), res=e(fina(m['resumo'], 240)))


def lista_materias(itens):
    if not itens:
        return '    <p class="vfm-resultado-vazio">Ainda não há notícias aqui.</p>\n'
    com_foto = [m for m in itens if m['foto_g']]
    primeira = com_foto[0] if com_foto else itens[0]   # o destaque sempre com foto, quando houver
    resto = [m for m in itens if m is not primeira]
    s = destaque(primeira)
    if resto:
        s += '    <ul class="vfm-cards">\n' + ''.join(card(m) for m in resto[:12]) + '    </ul>\n'
    s += '    <!-- WP: the_posts_pagination() gerando <nav class="vfm-paginacao"> com links e aria-current na página atual -->\n'
    return s


ICONE = {
    'whatsapp': '<svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.2-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>',
    'facebook': '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z"/></svg>',
    'x': '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/></svg>',
    'link': '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
    'microfone': '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></svg>',
}
PLAY = '''<svg class="vfm-play__tocar" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z"/></svg><svg class="vfm-play__pausar" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg><svg class="vfm-play__girando" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9"/></svg>'''


def compartilhar(m):
    url = ENDERECO + url_materia(m)
    t = m['titulo']
    return '''<div class="vfm-compartilhar">
          <span>Compartilhar</span>
          <a href="https://wa.me/?text={wa}" target="_blank" rel="noopener" aria-label="Compartilhar no WhatsApp" title="WhatsApp">{i_wa}</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u={u}" target="_blank" rel="noopener" aria-label="Compartilhar no Facebook" title="Facebook">{i_fb}</a>
          <a href="https://twitter.com/intent/tweet?text={tq}&amp;url={u}" target="_blank" rel="noopener" aria-label="Compartilhar no X" title="X">{i_x}</a>
          <button type="button" data-vfm-copiar="{url}" title="Copiar o link">{i_l}<span class="vfm-so-leitor" data-vfm-copiar-rotulo>Copiar o link</span></button>
        </div>'''.format(wa=quote(t + ' ' + url), u=quote(url, safe=''), tq=quote(t), url=e(url),
                         i_wa=ICONE['whatsapp'], i_fb=ICONE['facebook'], i_x=ICONE['x'], i_l=ICONE['link'])


OUCA = '''      <section class="vfm-ouca" aria-label="Rádio ao vivo">
        <button class="vfm-play" type="button" data-vfm-play aria-pressed="false" aria-label="Ouvir a rádio ao vivo">{play}</button>
        <div class="vfm-ouca__texto">
          <strong>Ouça a Verde FM <span data-vfm-texto="cidade">Cuiabá</span> ao vivo</strong>
          <span>No ar agora: <span data-vfm-programa>Verde FM</span></span>
        </div>
        <a class="vfm-botao vfm-botao--contorno" href="/programacao.html">Programação</a>
      </section>
'''.format(play=PLAY)

# ======================================================================= 3. matérias
ultimas = MATERIAS[:8]
for m in MATERIAS:
    figura = ''
    if m['foto_g']:
        legenda = '<figcaption>%s</figcaption>' % e(m['legenda']) if m['legenda'] else ''
        figura = '    <figure class="vfm-materia__foto"><img src="%s" alt="" width="1280" height="720" fetchpriority="high">%s</figure>\n' % (e(m['foto_g']), legenda)
    rel = [x for x in MATERIAS if x['editoria'] == m['editoria'] and x['slug'] != m['slug']][:3]
    if len(rel) < 3:
        rel += [x for x in MATERIAS if x['slug'] != m['slug'] and x not in rel][:3 - len(rel)]
    lat = ''.join('<li><a href="%s">%s</a></li>' % (url_materia(x), e(x['titulo'])) for x in ultimas if x['slug'] != m['slug'])
    ed_href = url_editoria(m)
    corpo = BANNER + trilha(('Início', '/'), (m['editoria_rotulo'], ed_href), (curto(m['titulo']), None)) + '''  <article class="vfm-container vfm-materia">
    <!-- WP: single.php -->
    <header class="vfm-materia__cabeca">
      {chap}
      <h1>{tit}</h1>
      <p class="vfm-materia__fina">{res}</p>
      <div class="vfm-materia__linha">
        <div class="vfm-assinatura-materia">
          <span class="vfm-assinatura-materia__selo">{mic}</span>
          <span><strong>Redação Verde FM</strong><time datetime="{iso}">{dh}</time></span>
        </div>
        {comp}
      </div>
    </header>
{fig}    <div class="vfm-materia__grade">
      <div>
        <!-- WP: the_content() -->
        <div class="vfm-texto">
{txt}
        </div>
{ouca}        <div class="vfm-materia__fim">
          <span class="vfm-meta">Publicada em <time datetime="{iso}">{dh}</time></span>
          {comp}
        </div>
      </div>
      <aside class="vfm-materia__lateral" aria-label="Mais notícias">
        <div class="vfm-fixo">
          <div class="vfm-pub-quadrado" aria-label="Publicidade"><span>Publicidade</span><span>300 × 250</span></div>
          <section class="vfm-lista-numerada" style="margin-top: 28px">
            <h2>Últimas notícias</h2>
            <ol>{lat}</ol>
          </section>
        </div>
      </aside>
    </div>
  </article>
  <section class="vfm-secao vfm-secao--branca" aria-labelledby="leia-tambem">
    <div class="vfm-container">
      <h2 class="vfm-secao-titulo" id="leia-tambem">Leia também</h2>
      <ul class="vfm-cards">
{rel}      </ul>
    </div>
  </section>'''.format(chap=chapeu(m), tit=e(m['titulo']), res=e(fina(m['resumo'])), mic=ICONE['microfone'], iso=m['data'], dh=data_hora(m['data']),
                     comp=compartilhar(m), fig=figura, txt=m['conteudo'], ouca=OUCA, lat=lat, rel=''.join(card(x) for x in rel))
    pagina('noticia/%s.html' % m['slug'], m['titulo'] + ' · Verde FM', m['resumo'], 'vfm-pagina-materia', corpo)

# ======================================================================= 4. editorias
for slug, (nome, desc) in EDITORIAS.items():
    itens = [m for m in MATERIAS if m['editoria'] == slug]
    corpo = BANNER + trilha(('Início', '/'), (nome, None)) + '''  <div class="vfm-container">
    <!-- WP: category.php -->
    <header class="vfm-cabeca-pagina">
      <div><span class="vfm-chapeu">Editoria</span><h1>{n}</h1><p>{d}</p></div>
    </header>
{lista}  </div>
  <div style="height: 48px"></div>'''.format(n=e(nome), d=e(desc), lista=lista_materias(itens))
    pagina('editoria/%s.html' % slug, nome + ' · Verde FM', desc, 'vfm-pagina-editoria', corpo)

# ======================================================================= 5. cidades
for c in CIDADES:
    if not c['ativa']:
        continue
    itens = [m for m in MATERIAS if m['cidade'] == c['slug']]
    corpo = BANNER + trilha(('Início', '/'), ('Cidades', None), (c['nome'], None)) + '''  <div class="vfm-container">
    <!-- WP: taxonomy-cidade.php -->
    <header class="vfm-cabeca-pagina">
      <div class="vfm-cabeca-pagina__marca">
        <img src="/assets/img/logos/{s}.png" alt="Verde FM {n} {f}" width="840" height="200">
        <div><h1>Notícias de {n}</h1><p>O que acontece em {n} e região, com a Verde FM {f}.</p></div>
      </div>
      <button class="vfm-botao" type="button" data-vfm-ouvir-cidade="{s}">{play_p} Ouvir a Verde {n}</button>
    </header>
{lista}  </div>
  <div style="height: 48px"></div>'''.format(s=c['slug'], n=e(c['nome']), f=c['frequencia'], lista=lista_materias(itens),
                                            play_p='<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z"/></svg>')
    pagina('cidade/%s.html' % c['slug'], 'Notícias de %s · Verde FM %s' % (c['nome'], c['frequencia']), 'Notícias de %s e a Verde FM %s ao vivo.' % (c['nome'], c['frequencia']), 'vfm-pagina-cidade', corpo)

# ======================================================================= 6. vídeos
v0 = D['videos'][0]
itens_v = '''        <li><button class="vfm-tv__item vfm-tv__item--aovivo" type="button" data-vfm-video="ao-vivo" data-titulo="Transmissão ao vivo do estúdio" aria-current="false">
          <span class="vfm-tv__miniatura vfm-tv__miniatura--aovivo" aria-hidden="true"><span class="vfm-ponto"></span></span>
          <span class="vfm-tv__item-texto"><strong>Transmissão ao vivo</strong><small>Estúdio da Verde FM</small></span>
        </button></li>
''' + ''.join('''        <li><button class="vfm-tv__item" type="button" data-vfm-video="{id}" data-titulo="{t}" aria-current="{a}">
          <img class="vfm-tv__miniatura" src="https://i.ytimg.com/vi/{id}/mqdefault.jpg" alt="" width="320" height="180" loading="lazy">
          <span class="vfm-tv__item-texto"><strong>{t}</strong><small>{d}</small></span>
        </button></li>
'''.format(id=v['id'], t=e(v['titulo']), a='true' if v is v0 else 'false', d=datetime.fromisoformat(v['data']).strftime('%d/%m/%Y')) for v in D['videos'])
corpo = trilha(('Início', '/'), ('Vídeos', None)) + '''  <div class="vfm-container">
    <!-- WP: page-videos.php (vídeos pelo feed do canal, como na home) -->
    <header class="vfm-cabeca-pagina">
      <div><span class="vfm-chapeu">Verde FM no YouTube</span><h1>Vídeos</h1><p>Entrevistas, o Jornal da Verde e a transmissão ao vivo do estúdio.</p></div>
      <a class="vfm-link-mais" href="https://www.youtube.com/@VerdeFMoficial" target="_blank" rel="noopener">Ver o canal no YouTube</a>
    </header>
    <div class="vfm-tv vfm-tv--pagina" data-vfm-tv data-canal="UC6WHqxKeQgo9b7rRtF43ifA" data-atual="{id}">
      <div class="vfm-tv__principal">
        <div class="vfm-tv__tela" data-vfm-tv-tela>
          <button class="vfm-tv__capa" type="button" data-vfm-tv-assistir>
            <img class="vfm-tv__capa-img" data-vfm-tv-capa src="https://i.ytimg.com/vi/{id}/maxresdefault.jpg" alt="" width="1280" height="720">
            <span class="vfm-tv__capa-aovivo" aria-hidden="true"><img src="/assets/img/logos/cuiaba.png" data-vfm-logo alt="" width="840" height="200"><span>Transmissão do estúdio</span></span>
            <span class="vfm-tv__selo"><span class="vfm-ponto" aria-hidden="true"></span><span data-vfm-tv-selo>Último vídeo</span></span>
            <span class="vfm-tv__play" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z"/></svg></span>
            <span class="vfm-so-leitor">Assistir: </span><span class="vfm-so-leitor" data-vfm-tv-rotulo>{t}</span>
          </button>
        </div>
        <div class="vfm-tv__legenda">
          <h2 data-vfm-tv-titulo>{t}</h2>
          <a class="vfm-link-mais" data-vfm-tv-link href="https://www.youtube.com/watch?v={id}" target="_blank" rel="noopener">Abrir no YouTube</a>
        </div>
      </div>
      <ul class="vfm-videos" aria-label="Todos os vídeos">
{itens}      </ul>
    </div>
  </div>
  <div style="height: 48px"></div>'''.format(id=v0['id'], t=e(v0['titulo']), itens=itens_v)
pagina('videos.html', 'Vídeos · Verde FM', 'Entrevistas, o Jornal da Verde e a transmissão ao vivo do estúdio da Verde FM.', 'vfm-pagina-videos', corpo)

# ======================================================================= 7. programação
blocos = ''
for c in CIDADES:
    g = D['grades'].get(c['slug'], [])
    if not g:
        continue
    abas = ''
    paineis = ''
    for i, b in enumerate(g):
        ida = 'aba-%s-%d' % (c['slug'], i)
        idp = 'grade-%s-%d' % (c['slug'], i)
        dias = ','.join(map(str, b['dias']))
        abas += '<button type="button" role="tab" id="%s" aria-controls="%s" aria-selected="%s" tabindex="%s" data-vfm-dias="%s">%s</button>' % (
            ida, idp, 'true' if i == 0 else 'false', '0' if i == 0 else '-1', dias, e(b['rotulo']))
        itens = ''.join('''          <li data-inicio="{i}" data-fim="{f}"><time>{hi} às {hf}</time><span><strong>{p}</strong>{a}</span><span class="vfm-selo-aovivo"><span class="vfm-ponto" aria-hidden="true"></span>No ar</span></li>
'''.format(i=p['inicio'], f=p['fim'], hi=hora(p['inicio']), hf=hora(p['fim']), p=e(p['programa']),
           a=('<small>%s</small>' % e(p['apresentador'])) if p['apresentador'] else '') for p in b['programas'])
        paineis += '''      <div role="tabpanel" id="{idp}" aria-labelledby="{ida}" tabindex="0"{h}>
        <ol class="vfm-grade-programas" data-vfm-grade data-vfm-dias="{d}">
{itens}        </ol>
      </div>
'''.format(idp=idp, ida=ida, h='' if i == 0 else ' hidden', d=dias, itens=itens)
    blocos += '''    <section data-vfm-so-cidade="{s}" data-vfm-abas{h} aria-label="Programação da Verde FM {n}">
      <div class="vfm-abas" role="tablist" aria-label="Dias da semana">{abas}</div>
{paineis}    </section>
'''.format(s=c['slug'], h='' if c['slug'] == 'cuiaba' else ' hidden', n=e(c['nome']), abas=abas, paineis=paineis)
corpo = trilha(('Início', '/'), ('Programação', None)) + '''  <div class="vfm-container">
    <!-- WP: page-programacao.php (CPT "programa": dias, início, fim, apresentador e cidade) -->
    <header class="vfm-cabeca-pagina">
      <div><span class="vfm-chapeu">Verde FM <span data-vfm-texto="cidade">Cuiabá</span> · <span data-vfm-texto="frequencia">103.7</span></span><h1>Programação</h1><p>A grade da rádio da sua cidade. Troque a cidade lá em cima para ver a de outra praça.</p></div>
      <button class="vfm-botao" type="button" data-vfm-play aria-pressed="false" aria-label="Ouvir a rádio ao vivo"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z"/></svg> Ouvir agora</button>
    </header>
{blocos}  </div>
  <div style="height: 56px"></div>'''.format(blocos=blocos)
pagina('programacao.html', 'Programação · Verde FM', 'Grade de programação da Verde FM em Cuiabá, Campo Verde e Jaciara.', 'vfm-pagina-programacao', corpo)

# ======================================================================= 8. promoções
opcoes = ''.join('<option>%s</option>' % e(c['nome']) for c in CIDADES if c['ativa'])
corpo = trilha(('Início', '/'), ('Promoções', None)) + '''  <div class="vfm-container">
    <!-- WP: page-promocoes.php (CPT "promocao"; formulário por Contact Form 7, Gravity Forms ou similar com estas classes).
         Sem promoção ativa: só o aviso .vfm-promo-vazia. Com promoção: o bloco .vfm-promo com os dados reais. -->
    <header class="vfm-cabeca-pagina">
      <div><span class="vfm-chapeu">Ouvinte da Verde ganha mais</span><h1>Promoções</h1><p>Participe das promoções da Verde FM da sua cidade.</p></div>
    </header>
    <div class="vfm-resultado-vazio vfm-promo-vazia" role="status">
      <strong>Nenhuma promoção aberta agora.</strong>
      <span>Fique ligado na Verde: a próxima é anunciada no ar e aparece aqui.</span>
      <button class="vfm-botao" type="button" data-vfm-play aria-pressed="false" aria-label="Ouvir a rádio ao vivo"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z"/></svg> Ouvir a Verde agora</button>
    </div>
    <h2 class="vfm-secao-titulo">Como uma promoção aparece no portal</h2>
    <p class="vfm-meta" style="margin: -12px 0 20px">Exemplo de demonstração do layout: nenhuma inscrição é enviada.</p>
    <article class="vfm-promo">
      <div class="vfm-promo__arte">
        <span class="vfm-chapeu">Exemplo</span>
        <h2>Promoção da semana</h2>
        <p>Aqui entram o prêmio, até quando vale e como o ganhador é escolhido.</p>
      </div>
      <form class="vfm-formulario" data-vfm-promo-demo novalidate>
        <div class="vfm-campo"><label for="p-nome">Seu nome</label><input id="p-nome" name="nome" autocomplete="name" aria-describedby="p-nome-erro"><p class="vfm-erro-campo" id="p-nome-erro" hidden>Informe seu nome.</p></div>
        <div class="vfm-campo"><label for="p-zap">WhatsApp</label><input id="p-zap" name="whatsapp" type="tel" inputmode="tel" placeholder="(65) 99999-9999" autocomplete="tel" aria-describedby="p-zap-erro"><p class="vfm-erro-campo" id="p-zap-erro" hidden>Informe o WhatsApp com DDD, como (65) 99999-9999.</p></div>
        <div class="vfm-campo"><label for="p-cidade">Cidade</label><select id="p-cidade" name="cidade">{op}</select></div>
        <label class="vfm-aceite"><input type="checkbox" name="aceite" id="p-aceite" aria-describedby="p-aceite-erro"> Li e aceito o regulamento e o uso dos meus dados para esta promoção.</label>
        <p class="vfm-erro-campo" id="p-aceite-erro" hidden>Para participar, aceite o regulamento.</p>
        <button class="vfm-botao" type="submit">Quero participar</button>
        <p class="vfm-aviso-form" data-vfm-promo-aviso hidden role="status">Inscrição feita! Boa sorte: o resultado sai na programação da Verde. (Demonstração: nada foi enviado.)</p>
      </form>
    </article>
    <script>
      /* Só da demonstração: no WordPress o plugin de formulário envia. A validação mostra o padrão de erro do tema. */
      (function () {{
        var f = document.querySelector('[data-vfm-promo-demo]');
        if (!f) return;
        var aviso = f.querySelector('[data-vfm-promo-aviso]');
        function marcar(campo, erro, ok) {{
          campo.setAttribute('aria-invalid', ok ? 'false' : 'true');
          document.getElementById(erro).hidden = ok;
          return ok;
        }}
        f.addEventListener('submit', function (ev) {{
          ev.preventDefault();
          var nome = f.elements.nome, zap = f.elements.whatsapp, aceite = f.elements.aceite;
          var digitos = zap.value.replace(/[^0-9]/g, '');
          var ok1 = marcar(nome, 'p-nome-erro', nome.value.trim().length > 1);
          var ok2 = marcar(zap, 'p-zap-erro', digitos.length === 10 || digitos.length === 11);
          var ok3 = marcar(aceite, 'p-aceite-erro', aceite.checked);
          aviso.hidden = !(ok1 && ok2 && ok3);
          var primeiro = !ok1 ? nome : !ok2 ? zap : !ok3 ? aceite : null;
          if (primeiro) primeiro.focus();
        }});
      }})();
    </script>
  </div>
  <div style="height: 56px"></div>'''.format(op=opcoes)
pagina('promocoes.html', 'Promoções · Verde FM', 'Promoções da Verde FM para os ouvintes de Cuiabá, Campo Verde e Jaciara.', 'vfm-pagina-promocoes', corpo)

# ======================================================================= 9. busca
indice = [{'u': url_materia(m), 't': m['titulo'], 'r': m['resumo'], 'e': m['editoria_rotulo'], 'd': data_br(m['data']),
           'iso': m['data'], 'f': m['foto_m'] or FOTO_VAZIA} for m in MATERIAS]
gravar('assets/demo/busca.json', json.dumps(indice, ensure_ascii=False))
corpo = trilha(('Início', '/'), ('Busca', None)) + '''  <div class="vfm-container">
    <!-- WP: search.php (o próprio WordPress faz a busca: ?s=termo) -->
    <header class="vfm-cabeca-pagina">
      <div style="flex: 1 1 100%">
        <h1>Buscar notícias</h1>
        <form class="vfm-busca-pagina" role="search" method="get" action="/busca.html" data-vfm-busca>
          <label class="vfm-so-leitor" for="busca-pagina">Buscar notícias</label>
          <input id="busca-pagina" type="search" name="s" placeholder="Digite o que você procura" data-vfm-busca-campo>
          <button class="vfm-botao" type="submit">Buscar</button>
        </form>
      </div>
    </header>
    <p class="vfm-meta" data-vfm-busca-resumo role="status"></p>
    <ul class="vfm-cards" data-vfm-busca-resultados style="margin-top: 20px"></ul>
    <script src="/assets/demo/busca-demo.js"></script>
  </div>
  <div style="height: 56px"></div>'''
pagina('busca.html', 'Buscar · Verde FM', 'Busque notícias da Verde FM.', 'vfm-pagina-busca', corpo)

# ======================================================================= 10. 404
corpo = '''  <div class="vfm-container vfm-erro">
    <!-- WP: 404.php -->
    <span class="vfm-erro__numero" aria-hidden="true">404</span>
    <h1>Esta página saiu do ar</h1>
    <p>O endereço pode ter mudado ou a notícia foi retirada. Busque o que você procura ou volte para o início.</p>
    <form class="vfm-busca-pagina" role="search" method="get" action="/busca.html" data-vfm-busca>
      <label class="vfm-so-leitor" for="busca-404">Buscar notícias</label>
      <input id="busca-404" type="search" name="s" placeholder="Buscar notícias">
      <button class="vfm-botao" type="submit">Buscar</button>
    </form>
    <div class="vfm-atalhos">
      <a class="vfm-botao" href="/">Ir para o início</a>
      <a class="vfm-botao vfm-botao--contorno" href="/videos.html">Vídeos</a>
      <a class="vfm-botao vfm-botao--contorno" href="/programacao.html">Programação</a>
    </div>
  </div>'''
pagina('404.html', 'Página não encontrada · Verde FM', 'Página não encontrada.', 'vfm-pagina-erro', corpo)

print('ok:', len(MATERIAS), 'matérias,', len(EDITORIAS), 'editorias, 3 cidades, vídeos, programação, promoções, busca e 404')
