/* Busca da DEMONSTRAÇÃO (Netlify). No WordPress quem busca é o próprio WordPress (search.php, ?s=termo);
   este arquivo não vai para o tema. Procura no índice /assets/demo/busca.json, sem acento e sem diferenciar maiúsculas. */
(function () {
  var lista = document.querySelector('[data-vfm-busca-resultados]');
  var resumo = document.querySelector('[data-vfm-busca-resumo]');
  var campo = document.querySelector('[data-vfm-busca-campo]');
  if (!lista) return;
  var termo = (new URLSearchParams(location.search).get('s') || '').trim();
  if (campo) campo.value = termo;
  var normal = function (t) { return (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var esc = function (t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; };

  fetch('/assets/demo/busca.json').then(function (r) { return r.json(); }).then(function (itens) {
    var palavras = normal(termo).split(/\s+/).filter(Boolean);
    var achados = palavras.length ? itens.filter(function (m) {
      var alvo = normal(m.t + ' ' + m.r + ' ' + m.e);
      return palavras.every(function (p) { return alvo.indexOf(p) !== -1; });
    }) : itens.slice(0, 12);
    resumo.textContent = palavras.length
      ? (achados.length ? achados.length + (achados.length === 1 ? ' notícia encontrada' : ' notícias encontradas') + ' para “' + termo + '”' : 'Nada encontrado para “' + termo + '”. Tente outra palavra.')
      : 'Últimas notícias';
    lista.innerHTML = achados.map(function (m) {
      return '<li><article class="vfm-card">' +
        '<a class="vfm-card__foto" href="' + m.u + '" tabindex="-1" aria-hidden="true"><img src="' + esc(m.f) + '" alt="" width="768" height="480" loading="lazy"></a>' +
        '<div class="vfm-meta"><span class="vfm-chapeu">' + esc(m.e) + '</span><time datetime="' + m.iso + '">' + m.d + '</time></div>' +
        '<h3><a href="' + m.u + '">' + esc(m.t) + '</a></h3><p>' + esc(m.r) + '</p></article></li>';
    }).join('');
  });
})();
