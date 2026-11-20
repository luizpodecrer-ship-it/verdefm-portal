/* ==========================================================================
   Verde FM · Portal de notícias — comportamento do site
   JavaScript puro, sem biblioteca, sem etapa de build.

   O que este arquivo faz:
     1. Cidades ........ lê as cidades do JSON #vfm-cidades, lembra a escolha
                         (cookie "vfm_cidade", que o WordPress também lê) e troca
                         logo, textos e a rádio ao vivo.
     2. Seletor ........ lista que abre ao lado do logo, com teclado (setas, Esc).
     3. Rádio .......... um único <audio> fora da área que troca de página;
                         todos os botões [data-vfm-play] controlam o mesmo áudio.
     4. Navegação ...... troca só o conteúdo (#vfm-conteudo) ao clicar em links
        contínua         do próprio site, então a rádio não para.
     5. Janelas ........ menu do celular e busca (<dialog>).
     6. Vídeos ......... transmissão ao vivo do YouTube e últimos vídeos: o vídeo só
                         carrega no toque (capa leve); vídeo e rádio não tocam juntos.
     7. Cabeçalho ...... fica preso no topo ao rolar e encolhe um pouco (.vfm-rolou).
     8. Letreiro ....... faixa "Últimas" correndo sem parar, com pausa (mouse, foco ou botão).
     9. Publicidade .... banner do topo em rodízio (troca a cada 8 s; para no mouse e no foco).
    10. Programação ... programa no ar pela grade da cidade (fuso de Cuiabá); marca o programa no ar
                         nas grades ([data-vfm-grade]) e abre a aba do dia.
    11. Ações ......... [data-vfm-ouvir-cidade] troca a cidade e toca; [data-vfm-copiar] copia o link.

   Eventos para o WordPress / plugins (ouvir com document.addEventListener):
     "vfm:pagina"  → depois de trocar de página (reiniciar anúncios, embeds, analytics)
     "vfm:cidade"  → depois de trocar de cidade (detail: { cidade })
   API pública: window.VerdeFM  (cidadeAtual, trocarCidade, navegar, tocar, pausar, pararVideos)
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var raiz = doc.documentElement;
  var COOKIE = 'vfm_cidade';
  var ehArquivoLocal = location.protocol === 'file:';

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function emitir(nome, detail) { doc.dispatchEvent(new CustomEvent(nome, { detail: detail || {} })); }

  /* ----------------------------------------------------------------------
     1. Cidades
     ---------------------------------------------------------------------- */
  var cidades = [];
  try { cidades = JSON.parse(($('#vfm-cidades') || {}).textContent || '[]'); } catch (e) { cidades = []; }

  function porSlug(slug) {
    for (var i = 0; i < cidades.length; i++) if (cidades[i].slug === slug) return cidades[i];
    return null;
  }
  function lerCookie(nome) {
    var m = doc.cookie.match(new RegExp('(?:^|; )' + nome + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function gravarCookie(nome, valor) {
    doc.cookie = nome + '=' + encodeURIComponent(valor) + '; path=/; max-age=31536000; SameSite=Lax';
  }
  function lerPreferencia() {
    // Ordem: cookie (o WordPress usa) → navegador → cidade padrão do HTML.
    var slug = lerCookie(COOKIE);
    if (!slug) { try { slug = localStorage.getItem(COOKIE) || ''; } catch (e) {} }
    var c = porSlug(slug);
    if (!c || !c.ativa) c = porSlug(raiz.getAttribute('data-vfm-cidade-padrao')) || cidades[0];
    return c;
  }

  var cidade = lerPreferencia();

  function aplicarCidade(c) {
    if (!c) return;
    raiz.setAttribute('data-vfm-cidade', c.slug);
    $$('[data-vfm-logo]').forEach(function (img) {
      img.src = c.logo;
      img.alt = 'Verde FM ' + c.nome + ' ' + c.frequencia;
    });
    $$('[data-vfm-texto="cidade"]').forEach(function (el) { el.textContent = c.nome; });
    $$('[data-vfm-texto="frequencia"]').forEach(function (el) { el.textContent = c.frequencia; });
    // Blocos de uma cidade só (ex.: "Em {cidade}" quando o HTML traz todas): mostra só os da escolhida.
    $$('[data-vfm-so-cidade]').forEach(function (el) { el.hidden = el.getAttribute('data-vfm-so-cidade') !== c.slug; });
    // Links que dependem da cidade: data-vfm-link-cidade="/cidade/{cidade}.html"
    $$('[data-vfm-link-cidade]').forEach(function (a) { a.setAttribute('href', a.getAttribute('data-vfm-link-cidade').replace('{cidade}', c.slug)); });
    if (typeof atualizarProgramacao === 'function' && cidades.length) atualizarProgramacao();
    $$('.vfm-cidade__opcao').forEach(function (op) {
      var atual = op.getAttribute('data-cidade') === c.slug;
      op.setAttribute('aria-current', atual ? 'true' : 'false');
      var nota = $('.vfm-cidade__nota', op);
      if (nota && op.getAttribute('aria-disabled') !== 'true') nota.textContent = atual ? 'Você está aqui' : '';
    });
  }

  function trocarCidade(slug) {
    var nova = porSlug(slug);
    if (!nova || !nova.ativa || nova.slug === cidade.slug) return;
    cidade = nova;
    gravarCookie(COOKIE, nova.slug);
    try { localStorage.setItem(COOKIE, nova.slug); } catch (e) {}
    aplicarCidade(nova);
    radioTrocarCidade();
    anunciar('Você está em ' + nova.nome + '. Rádio Verde FM ' + nova.frequencia + '.');
    emitir('vfm:cidade', { cidade: nova });
    // As notícias "Em {cidade}", a programação e a publicidade vêm do servidor:
    // recarrega só o conteúdo da página atual, já com o cookie novo.
    if (!ehArquivoLocal) navegar(location.href, { historico: false, manterRolagem: true });
  }

  /* ----------------------------------------------------------------------
     2. Seletor de cidade
     ---------------------------------------------------------------------- */
  function ligarSeletor() {
    var botao = $('.vfm-cidade__botao');
    var lista = $('.vfm-cidade__lista');
    if (!botao || !lista) return;
    var opcoes = $$('.vfm-cidade__opcao', lista);

    function abrir(focarPrimeira) {
      lista.hidden = false;
      botao.setAttribute('aria-expanded', 'true');
      if (focarPrimeira) {
        var alvo = $('.vfm-cidade__opcao[aria-current="true"]', lista) || opcoes[0];
        alvo && alvo.focus();
      }
    }
    function fechar(devolverFoco) {
      if (lista.hidden) return;
      lista.hidden = true;
      botao.setAttribute('aria-expanded', 'false');
      if (devolverFoco) botao.focus();
    }

    botao.addEventListener('click', function () { lista.hidden ? abrir(false) : fechar(false); });
    botao.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); abrir(true); }
    });
    lista.addEventListener('keydown', function (e) {
      var i = opcoes.indexOf(doc.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); opcoes[(i + 1) % opcoes.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); opcoes[(i - 1 + opcoes.length) % opcoes.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); opcoes[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); opcoes[opcoes.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); fechar(true); }
      else if (e.key === 'Tab') { fechar(false); }
    });
    opcoes.forEach(function (op) {
      op.addEventListener('click', function () {
        if (op.getAttribute('aria-disabled') === 'true') return;
        fechar(true);
        trocarCidade(op.getAttribute('data-cidade'));
      });
    });
    doc.addEventListener('click', function (e) {
      if (!e.target.closest('.vfm-cidade')) fechar(false);
    });
  }

  /* ----------------------------------------------------------------------
     3. Rádio ao vivo
     ---------------------------------------------------------------------- */
  var audio = $('#vfm-audio');
  var querTocar = false;

  function radioEstado() {
    var tocando = audio && !audio.paused && querTocar;
    raiz.classList.toggle('vfm-tocando', !!tocando);
    var rotulo = tocando ? 'Pausar a rádio' : 'Ouvir a rádio ao vivo';
    $$('[data-vfm-play]').forEach(function (b) {
      b.setAttribute('aria-label', rotulo + ' de ' + cidade.nome);
      b.setAttribute('aria-pressed', tocando ? 'true' : 'false');
    });
    $$('[data-vfm-play-rotulo]').forEach(function (el) { el.textContent = rotulo; });
  }
  function radioAviso(texto) {
    $$('[data-vfm-player-status]').forEach(function (el) { el.textContent = texto || ''; });
  }
  function carregando(sim) { raiz.classList.toggle('vfm-carregando-audio', !!sim); }

  function tocar() {
    if (!audio || !cidade.stream) { radioAviso('A rádio desta cidade ainda não está no ar.'); return; }
    querTocar = true;
    radioAviso('');
    pararVideos(); // rádio e vídeo não tocam ao mesmo tempo
    // Rádio ao vivo: sempre recarrega o endereço para voltar ao "agora".
    audio.src = cidade.stream;
    carregando(true);
    var p = audio.play();
    if (p && p.catch) p.catch(function () {
      querTocar = false; carregando(false); radioEstado();
      radioAviso('Não foi possível tocar agora. Tente de novo em instantes.');
    });
    raiz.classList.add('vfm-tocou');
    metadadosDoAparelho();
  }
  function pausar() {
    querTocar = false;
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
    carregando(false);
    radioEstado();
  }
  function radioTrocarCidade() {
    if (querTocar) tocar(); else radioEstado();
    metadadosDoAparelho();
  }
  function metadadosDoAparelho() {
    // Nome da rádio na tela de bloqueio e nos fones (Android, iPhone, Chrome).
    if (!('mediaSession' in navigator) || !window.MediaMetadata) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Verde FM ' + cidade.frequencia,
      artist: cidade.nome + ' · ao vivo',
      artwork: [{ src: cidade.logo, sizes: '840x200', type: 'image/png' }]
    });
    navigator.mediaSession.setActionHandler('play', tocar);
    navigator.mediaSession.setActionHandler('pause', pausar);
    navigator.mediaSession.setActionHandler('stop', pausar);
  }

  function ligarRadio() {
    if (!audio) return;
    audio.addEventListener('playing', function () { carregando(false); radioEstado(); });
    audio.addEventListener('waiting', function () { if (querTocar) carregando(true); });
    audio.addEventListener('pause', radioEstado);
    audio.addEventListener('error', function () {
      if (!querTocar) return;
      querTocar = false; carregando(false); radioEstado();
      radioAviso('A transmissão caiu. Toque de novo para voltar.');
    });
    // Delegação: funciona também nos botões que chegam com a navegação contínua.
    doc.addEventListener('click', function (e) {
      var b = e.target.closest('[data-vfm-play]');
      if (!b) return;
      e.preventDefault();
      querTocar ? pausar() : tocar();
    });
    var volume = $('[data-vfm-volume]');
    var mudo = $('[data-vfm-mudo]');
    function mostrarSom() {
      var semSom = audio.muted || audio.volume === 0;
      if (mudo) {
        mudo.setAttribute('aria-pressed', semSom ? 'true' : 'false');
        mudo.setAttribute('aria-label', semSom ? 'Ligar o som' : 'Tirar o som');
        if (mudo.parentNode) mudo.parentNode.classList.toggle('vfm-volume--mudo', semSom);
      }
    }
    if (volume) volume.addEventListener('input', function () {
      audio.volume = Number(volume.value);
      audio.muted = audio.volume === 0;
      volume.style.setProperty('--vfm-vol', Math.round(audio.volume * 100) + '%');
      mostrarSom();
    });
    if (mudo) mudo.addEventListener('click', function () {
      audio.muted = !audio.muted;
      if (!audio.muted && audio.volume === 0) { audio.volume = .6; if (volume) { volume.value = .6; volume.style.setProperty('--vfm-vol', '60%'); } }
      mostrarSom();
    });
    radioEstado();
  }

  /* ----------------------------------------------------------------------
     4. Navegação contínua (a rádio não para ao abrir uma notícia)
     ---------------------------------------------------------------------- */
  var areaId = 'vfm-conteudo';
  var navegacaoAtual = null;
  var IGNORAR = /\/(wp-admin|wp-login\.php|wp-json|feed)(\/|$)|\.(pdf|jpe?g|png|gif|webp|svg|zip|mp3|mp4|xml|txt)$/i;

  function linkInterno(a) {
    if (!a || !a.href || a.target && a.target !== '_self' || a.hasAttribute('download')) return false;
    if (a.hasAttribute('data-vfm-normal') || a.closest('[data-vfm-normal]')) return false;
    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return false; }
    if (url.origin !== location.origin) return false;
    if (IGNORAR.test(url.pathname)) return false;
    // Âncora na mesma página: deixa o navegador rolar.
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
    return true;
  }

  function navegar(url, opcoes) {
    opcoes = opcoes || {};
    if (ehArquivoLocal || !window.fetch || !window.DOMParser) { location.href = url; return; }
    if (navegacaoAtual) navegacaoAtual.abort();
    var controle = window.AbortController ? new AbortController() : null;
    navegacaoAtual = controle;
    raiz.classList.add('vfm-navegando');
    fecharJanelas();

    return fetch(url, {
      credentials: 'same-origin',
      headers: { 'X-VFM-Navegacao': '1' }, // o tema pode usar para enviar uma resposta mais leve
      signal: controle ? controle.signal : undefined
    }).then(function (r) {
      var tipo = r.headers.get('content-type') || '';
      if (!r.ok && r.status !== 404 || tipo.indexOf('text/html') === -1) throw new Error('fora');
      return r.text().then(function (html) { return { html: html, url: r.url || url }; });
    }).then(function (res) {
      var novo = new DOMParser().parseFromString(res.html, 'text/html');
      var novaArea = novo.getElementById(areaId);
      var area = doc.getElementById(areaId);
      if (!novaArea || !area) throw new Error('sem área');

      area.innerHTML = novaArea.innerHTML;
      doc.title = novo.title;
      doc.body.className = novo.body.className; // classes do WordPress (body_class)
      if (opcoes.historico !== false) history.pushState({ vfm: true }, '', res.url);
      else history.replaceState({ vfm: true }, '', res.url);

      rodarScripts(area);
      marcarMenu();
      aplicarCidade(cidade);
      radioEstado();

      var hash = new URL(res.url, location.href).hash;
      if (hash && doc.getElementById(hash.slice(1))) doc.getElementById(hash.slice(1)).scrollIntoView();
      else if (!opcoes.manterRolagem) window.scrollTo(0, 0);
      if (!opcoes.manterRolagem) {
        var h1 = $('h1', area) || area;
        h1.setAttribute('tabindex', '-1');
        h1.focus({ preventScroll: true });
      }
      anunciar('Página carregada: ' + doc.title);
      emitir('vfm:pagina', { url: res.url });
    }).catch(function (e) {
      if (e && e.name === 'AbortError') return;
      location.href = url; // qualquer problema: navegação normal
    }).then(function () {
      if (navegacaoAtual === controle) { navegacaoAtual = null; raiz.classList.remove('vfm-navegando'); }
    });
  }

  // Scripts que vierem dentro do conteúdo (embeds do Instagram, X, anúncios) precisam ser recriados para rodar.
  function rodarScripts(ctx) {
    $$('script', ctx).forEach(function (velho) {
      var novo = doc.createElement('script');
      for (var i = 0; i < velho.attributes.length; i++) novo.setAttribute(velho.attributes[i].name, velho.attributes[i].value);
      novo.text = velho.text;
      velho.parentNode.replaceChild(novo, velho);
    });
  }

  function marcarMenu() {
    var aqui = location.pathname.replace(/index\.html$/, '');
    $$('[data-vfm-menu] a').forEach(function (a) {
      var caminho;
      try { caminho = new URL(a.href, location.href).pathname.replace(/index\.html$/, ''); } catch (e) { return; }
      if (caminho === aqui && !a.hash) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function ligarNavegacao() {
    if (ehArquivoLocal || !window.history || !history.pushState) return;
    history.replaceState({ vfm: true }, '', location.href);
    doc.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest('a');
      if (!linkInterno(a)) return;
      e.preventDefault();
      navegar(a.href);
    });
    // Formulários de busca (GET) também navegam sem recarregar.
    doc.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form.matches('[data-vfm-busca]') || (form.method || 'get').toLowerCase() !== 'get') return;
      e.preventDefault();
      var url = new URL(form.action || location.href, location.href);
      url.search = new URLSearchParams(new FormData(form)).toString();
      navegar(url.href);
    });
    window.addEventListener('popstate', function (e) {
      if (e.state && e.state.vfm) navegar(location.href, { historico: false });
    });
  }

  /* ----------------------------------------------------------------------
     5. Janelas (menu do celular e busca)
     ---------------------------------------------------------------------- */
  function fecharJanelas() {
    $$('dialog.vfm-janela[open]').forEach(function (d) { d.close(); });
  }
  function ligarJanelas() {
    doc.addEventListener('click', function (e) {
      var abrir = e.target.closest('[data-vfm-abrir]');
      if (abrir) {
        var d = doc.getElementById(abrir.getAttribute('data-vfm-abrir'));
        if (d && d.showModal) {
          d.showModal();
          var campo = $('input', d);
          if (campo) campo.focus();
        }
        return;
      }
      if (e.target.closest('[data-vfm-fechar]')) { var dd = e.target.closest('dialog'); dd && dd.close(); return; }
      // Toque fora da janela (no fundo escuro) fecha.
      if (e.target.matches && e.target.matches('dialog.vfm-janela')) e.target.close();
    });
  }


  /* ----------------------------------------------------------------------
     6. Vídeos do YouTube (ao vivo + últimos vídeos)
     ---------------------------------------------------------------------- */
  function urlDoVideo(tv, id) {
    if (id === 'ao-vivo') return 'https://www.youtube.com/embed/live_stream?channel=' + encodeURIComponent(tv.getAttribute('data-canal')) + '&autoplay=1';
    return 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
  }
  function tirarFrame(tela) {
    var frame = tela && $('iframe', tela);
    if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
    return !!frame;
  }
  function assistir(tv) {
    var tela = $('[data-vfm-tv-tela]', tv);
    if (!tela) return;
    var id = tv.getAttribute('data-atual') || 'ao-vivo';
    tirarFrame(tela);
    var frame = doc.createElement('iframe');
    frame.src = urlDoVideo(tv, id);
    frame.title = ($('[data-vfm-tv-titulo]', tv) || {}).textContent || 'Vídeo da Verde FM';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    var capa = $('.vfm-tv__capa', tela);
    if (capa) capa.hidden = true;
    tela.appendChild(frame);
    if (querTocar) pausar(); // vídeo começou: a rádio para
  }
  function pararVideos() {
    $$('[data-vfm-tv]').forEach(function (tv) {
      if (!tirarFrame($('[data-vfm-tv-tela]', tv))) return;
      var capa = $('.vfm-tv__capa', tv);
      if (capa) capa.hidden = false;
    });
  }
  function escolherVideo(tv, botao) {
    var id = botao.getAttribute('data-vfm-video');
    var titulo = botao.getAttribute('data-titulo') || '';
    var aoVivo = id === 'ao-vivo';
    tv.setAttribute('data-atual', id);
    tv.classList.toggle('vfm-tv--ao-vivo', aoVivo);
    $$('[data-vfm-video]', tv).forEach(function (b) { b.setAttribute('aria-current', b === botao ? 'true' : 'false'); });
    var img = $('[data-vfm-tv-capa]', tv);
    if (img) {
      img.hidden = aoVivo;
      if (!aoVivo) capaDoVideo(img, id);
    }
    var t = $('[data-vfm-tv-titulo]', tv); if (t) t.textContent = titulo;
    var selo = $('[data-vfm-tv-selo]', tv); if (selo) selo.textContent = aoVivo ? 'Ao vivo' : 'Vídeo';
    var rotulo = $('[data-vfm-tv-rotulo]', tv); if (rotulo) rotulo.textContent = titulo;
    var link = $('[data-vfm-tv-link]', tv);
    if (link) link.href = aoVivo ? 'https://www.youtube.com/channel/' + tv.getAttribute('data-canal') + '/live' : 'https://www.youtube.com/watch?v=' + id;
    assistir(tv);
    // No celular a lista fica embaixo do vídeo: se o vídeo saiu da tela, volta para ele.
    var tela = $('[data-vfm-tv-tela]', tv);
    if (tela && tela.getBoundingClientRect().top < 0) tela.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function capaDoVideo(img, id) {
    // Capa em alta (maxresdefault). Vídeo antigo sem ela: o YouTube devolve uma imagem cinza
    // de 120 px; nesse caso usa a hqdefault.
    var base = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/';
    img.onload = function () { if (img.naturalWidth <= 120 && img.src.indexOf('hqdefault') === -1) img.src = base + 'hqdefault.jpg'; };
    img.onerror = function () { if (img.src.indexOf('hqdefault') === -1) img.src = base + 'hqdefault.jpg'; };
    img.src = base + 'maxresdefault.jpg';
  }
  function ligarVideos() {
    doc.addEventListener('click', function (e) {
      var item = e.target.closest('[data-vfm-video]');
      if (item) { escolherVideo(item.closest('[data-vfm-tv]'), item); return; }
      var play = e.target.closest('[data-vfm-tv-assistir]');
      if (play) assistir(play.closest('[data-vfm-tv]'));
    });
  }

  /* ----------------------------------------------------------------------
     7. Cabeçalho fixo: sempre à vista; encolhe depois que a pessoa rola
     ---------------------------------------------------------------------- */
  function ligarTopo() {
    var topo = $('.vfm-topo');
    if (!topo) return;
    var rolou = false;
    var agendado = false;
    function medir() { raiz.style.setProperty('--vfm-topo-altura', topo.offsetHeight + 'px'); }
    function conferir() {
      agendado = false;
      var y = window.pageYOffset || doc.documentElement.scrollTop;
      // Liga depois de 80 px e só desliga perto do topo: evita o cabeçalho "piscar".
      if (!rolou && y > 80) rolou = true;
      else if (rolou && y < 10) rolou = false;
      else return;
      raiz.classList.toggle('vfm-rolou', rolou);
      setTimeout(medir, 220); // depois da animação de encolher
    }
    window.addEventListener('scroll', function () {
      if (!agendado) { agendado = true; window.requestAnimationFrame(conferir); }
    }, { passive: true });
    window.addEventListener('resize', medir);
    doc.addEventListener('vfm:pagina', conferir);
    medir();
    conferir();
  }


  /* ----------------------------------------------------------------------
     8. Letreiro das últimas notícias
     ---------------------------------------------------------------------- */
  function ligarLetreiro() {
    var caixa = $('[data-vfm-letreiro]');
    if (!caixa) return;
    var lista = $('[data-vfm-letreiro-lista]', caixa);
    var botao = $('[data-vfm-letreiro-pausa]', caixa);
    // Quem pediu "reduzir movimento" no aparelho vê a lista parada (dá para arrastar).
    if (!lista || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    // Duplica os itens: a animação anda metade da lista e recomeça sem emenda.
    $$('li', lista).forEach(function (li) {
      var copia = li.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      $$('a', copia).forEach(function (a) { a.setAttribute('tabindex', '-1'); });
      lista.appendChild(copia);
    });
    function medir() {
      // Velocidade constante (~55 px por segundo), qualquer que seja o tamanho dos títulos.
      var segundos = Math.max(18, Math.round(lista.scrollWidth / 2 / 55));
      caixa.style.setProperty('--vfm-letreiro-tempo', segundos + 's');
    }
    medir();
    window.addEventListener('resize', medir);
    caixa.classList.add('vfm-letreiro--ligado');
    if (botao) {
      botao.hidden = false;
      botao.addEventListener('click', function () {
        var pausado = caixa.classList.toggle('vfm-letreiro--pausado');
        botao.setAttribute('aria-pressed', pausado ? 'true' : 'false');
        botao.setAttribute('aria-label', pausado ? 'Continuar as últimas notícias' : 'Pausar as últimas notícias');
      });
    }
  }


  /* ----------------------------------------------------------------------
     9. Rodízio de anúncios ([data-vfm-rodizio])
     ---------------------------------------------------------------------- */
  var RODIZIO_MS = 8000;
  function ligarRodizios() {
    $$('[data-vfm-rodizio]').forEach(function (caixa) {
      if (caixa.getAttribute('data-vfm-rodizio-ligado')) return; // já ligado (navegação contínua)
      caixa.setAttribute('data-vfm-rodizio-ligado', '1');
      var pecas = $$('.vfm-pub-topo__peca, [data-vfm-peca]', caixa);
      if (pecas.length < 2) return;
      var atual = 0;
      var parado = false;
      function mostrar(i) {
        pecas.forEach(function (p, j) {
          var ativa = j === i;
          p.classList.toggle('vfm-ativa', ativa);
          if (ativa) { p.removeAttribute('aria-hidden'); p.removeAttribute('tabindex'); }
          else { p.setAttribute('aria-hidden', 'true'); p.setAttribute('tabindex', '-1'); }
        });
        atual = i;
      }
      // Cada visita começa num anúncio diferente, para todos aparecerem.
      mostrar(Math.floor(Math.random() * pecas.length));
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      caixa.addEventListener('mouseenter', function () { parado = true; });
      caixa.addEventListener('mouseleave', function () { parado = false; });
      caixa.addEventListener('focusin', function () { parado = true; });
      caixa.addEventListener('focusout', function () { parado = false; });
      var relogio = setInterval(function () {
        if (!caixa.isConnected) { clearInterval(relogio); return; } // a página trocou
        if (parado || doc.hidden) return;
        mostrar((atual + 1) % pecas.length);
      }, RODIZIO_MS);
    });
  }

  /* ----------------------------------------------------------------------
     10. Programação: programa no ar (pela grade da cidade) e grades na página
     ---------------------------------------------------------------------- */
  function agoraEmCuiaba() {
    // Dia da semana (0 = domingo) e hora no fuso de Cuiabá, qualquer que seja o fuso do aparelho.
    try {
      var partes = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Cuiaba', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var v = {};
      partes.forEach(function (p) { v[p.type] = p.value; });
      var dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { dia: dias[v.weekday], hora: (Number(v.hour) % 24) + Number(v.minute) / 60 };
    } catch (e) {
      var d = new Date();
      return { dia: d.getDay(), hora: d.getHours() + d.getMinutes() / 60 };
    }
  }
  function noIntervalo(hora, inicio, fim) {
    // "21h às 0h" e "0h às 5h": o fim 0 vale 24; faixa que vira a noite também é tratada.
    if (fim === 0) fim = 24;
    return inicio < fim ? (hora >= inicio && hora < fim) : (hora >= inicio || hora < fim);
  }
  function programaNoAr(c) {
    var t = agoraEmCuiaba();
    var blocos = (c && c.grade) || [];
    for (var i = 0; i < blocos.length; i++) {
      if (blocos[i].dias.indexOf(t.dia) === -1) continue;
      var lista = blocos[i].programas;
      for (var j = 0; j < lista.length; j++) if (noIntervalo(t.hora, lista[j].inicio, lista[j].fim)) return lista[j];
    }
    return null;
  }
  function atualizarProgramacao() {
    var p = programaNoAr(cidade);
    $$('[data-vfm-programa]').forEach(function (el) { el.textContent = p ? p.programa : 'Verde FM ' + cidade.nome; });
    $$('[data-vfm-programa-apres]').forEach(function (el) { el.textContent = p && p.apresentador ? p.apresentador : ''; });
    var t = agoraEmCuiaba();
    // Blocos de grade de um dia só ([data-vfm-dias="1,2,3,4,5"]) aparecem só no dia certo, quando pedido.
    $$('[data-vfm-grade-hoje] [data-vfm-dias]').forEach(function (bloco) {
      var dias = bloco.getAttribute('data-vfm-dias').split(',').map(Number);
      bloco.classList.toggle('vfm-fora-do-dia', dias.indexOf(t.dia) === -1);
    });
    $$('[data-vfm-grade]').forEach(function (lista) {
      var dias = (lista.closest('[data-vfm-dias]') || lista).getAttribute('data-vfm-dias');
      var hoje = !dias || dias.split(',').map(Number).indexOf(t.dia) !== -1;
      var itens = $$('li[data-inicio]', lista);
      var atual = -1;
      itens.forEach(function (li, i) {
        var noAr = hoje && noIntervalo(t.hora, Number(li.getAttribute('data-inicio')), Number(li.getAttribute('data-fim')));
        li.classList.toggle('vfm-no-ar', noAr);
        if (noAr) atual = i;
      });
      // Versão curta (home): o programa no ar e os próximos.
      var curta = Number(lista.getAttribute('data-vfm-grade-curta') || 0);
      if (curta) itens.forEach(function (li, i) {
        var inicio = atual === -1 ? 0 : atual;
        li.hidden = i < inicio || i >= inicio + curta;
      });
    });
    // Abas da programação: abre na aba de hoje (só na primeira vez).
    $$('[data-vfm-abas]').forEach(function (grupo) {
      if (grupo.getAttribute('data-vfm-abas-hoje') === 'feito') return;
      grupo.setAttribute('data-vfm-abas-hoje', 'feito');
      $$('[role="tab"][data-vfm-dias]', grupo).forEach(function (aba) {
        if (aba.getAttribute('data-vfm-dias').split(',').map(Number).indexOf(t.dia) !== -1) abrirAba(aba);
      });
    });
  }
  function abrirAba(aba) {
    var grupo = aba.closest('[data-vfm-abas]');
    $$('[role="tab"]', grupo).forEach(function (a) {
      var sel = a === aba;
      a.setAttribute('aria-selected', sel ? 'true' : 'false');
      a.setAttribute('tabindex', sel ? '0' : '-1');
      var painel = doc.getElementById(a.getAttribute('aria-controls'));
      if (painel) painel.hidden = !sel;
    });
  }
  function ligarProgramacao() {
    doc.addEventListener('click', function (e) {
      var aba = e.target.closest('[data-vfm-abas] [role="tab"]');
      if (aba) abrirAba(aba);
    });
    doc.addEventListener('keydown', function (e) {
      var aba = e.target.closest && e.target.closest('[data-vfm-abas] [role="tab"]');
      if (!aba || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
      var abas = $$('[role="tab"]', aba.closest('[data-vfm-abas]'));
      var i = abas.indexOf(aba) + (e.key === 'ArrowRight' ? 1 : -1);
      var alvo = abas[(i + abas.length) % abas.length];
      abrirAba(alvo);
      alvo.focus();
      e.preventDefault();
    });
    setInterval(atualizarProgramacao, 60000); // troca o programa na virada da hora
  }

  /* ----------------------------------------------------------------------
     11. Pequenas ações: ouvir a rádio de uma cidade, copiar o link
     ---------------------------------------------------------------------- */
  function ligarAcoes() {
    doc.addEventListener('click', function (e) {
      var ouvir = e.target.closest('[data-vfm-ouvir-cidade]');
      if (ouvir) {
        e.preventDefault();
        var slug = ouvir.getAttribute('data-vfm-ouvir-cidade');
        if (slug !== cidade.slug) trocarCidade(slug);
        tocar();
        return;
      }
      var copiar = e.target.closest('[data-vfm-copiar]');
      if (copiar) {
        e.preventDefault();
        var url = copiar.getAttribute('data-vfm-copiar') || location.href;
        var rotulo = $('[data-vfm-copiar-rotulo]', copiar) || copiar;
        var antes = rotulo.textContent;
        var pronto = function () {
          rotulo.textContent = 'Link copiado';
          anunciar('Link copiado');
          setTimeout(function () { rotulo.textContent = antes; }, 2200);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(pronto, function () {});
      }
    });
  }

  /* ----------------------------------------------------------------------
     Utilitários
     ---------------------------------------------------------------------- */
  function anunciar(texto) {
    var el = $('#vfm-aviso');
    if (!el) return;
    el.textContent = '';
    setTimeout(function () { el.textContent = texto; }, 50);
  }

  function preencherData() {
    // O WordPress já escreve a data; isto só completa quando o elemento vier vazio.
    $$('[data-vfm-data]').forEach(function (el) {
      if (el.textContent.trim()) return;
      try {
        var t = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Cuiaba' }).format(new Date());
        el.textContent = t.charAt(0).toUpperCase() + t.slice(1);
      } catch (e) {}
    });
  }

  /* Início */
  function iniciar() {
    aplicarCidade(cidade);
    ligarSeletor();
    ligarRadio();
    ligarNavegacao();
    ligarJanelas();
    ligarVideos();
    ligarTopo();
    ligarLetreiro();
    ligarRodizios();
    ligarProgramacao();
    ligarAcoes();
    doc.addEventListener('vfm:pagina', ligarRodizios);
    marcarMenu();
    preencherData();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();

  window.VerdeFM = {
    cidadeAtual: function () { return cidade; },
    trocarCidade: trocarCidade,
    navegar: navegar,
    tocar: tocar,
    pausar: pausar,
    pararVideos: pararVideos
  };
})();
