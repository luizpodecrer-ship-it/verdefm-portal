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
    if (volume) volume.addEventListener('input', function () { audio.volume = Number(volume.value); });
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
      if (!aoVivo) img.src = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg';
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
  function ajustarAlturaDaLista() {
    // No computador a lista acompanha a altura do vídeo e rola por dentro.
    $$('[data-vfm-tv]').forEach(function (tv) {
      var principal = $('.vfm-tv__principal', tv);
      if (principal) tv.style.setProperty('--vfm-tv-altura', principal.offsetHeight + 'px');
    });
  }
  function ligarVideos() {
    doc.addEventListener('click', function (e) {
      var item = e.target.closest('[data-vfm-video]');
      if (item) { escolherVideo(item.closest('[data-vfm-tv]'), item); return; }
      var play = e.target.closest('[data-vfm-tv-assistir]');
      if (play) assistir(play.closest('[data-vfm-tv]'));
    });
    window.addEventListener('resize', ajustarAlturaDaLista);
    doc.addEventListener('vfm:pagina', ajustarAlturaDaLista);
    ajustarAlturaDaLista();
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
