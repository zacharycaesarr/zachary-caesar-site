/* ================================================================
   shop.js — dynamically renders product cards from data/products.js
   All product management happens in data/products.js only.
   ================================================================ */

(function () {
  var grid = document.getElementById('zc-product-grid');
  if (!grid) return;

  var products = window.ZC_PRODUCTS;
  if (!products || !products.length) {
    grid.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px">No products yet.</p>';
    return;
  }

  /* Build a card for each product */
  var html = products.map(function (p, i) {
    var ribbon   = p.ribbon
      ? '<span class="product-ribbon">' + p.ribbon + '</span>'
      : '';
    var imgEl    = p.image
      ? '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy" />'
      : '<div class="product-img-placeholder">ADD PRODUCT IMAGE</div>';
    var delay    = i < 4 ? ' data-delay="' + i + '"' : '';

    return [
      '<div class="product-card" data-reveal' + delay + '>',
      '  <div class="product-img">',
      '    ' + imgEl,
      '    ' + ribbon,
      '  </div>',
      '  <div class="product-info">',
      '    <span class="product-name">' + p.name  + '</span>',
      '    <span class="product-price">' + p.price + '</span>',
      '  </div>',
      '  <div class="quick-view">',
      '    <span class="qv-name">'  + p.name  + '</span>',
      '    <span class="qv-price">' + p.price + '</span>',
      '    <div class="qv-actions">',
      '      <a class="btn btn-fill" href="' + p.shopifyUrl + '" rel="noreferrer" target="_blank">ADD TO CART</a>',
      '      <a class="btn"          href="' + p.shopifyUrl + '" rel="noreferrer" target="_blank">VIEW PRODUCT</a>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
  });

  grid.innerHTML = html.join('\n');

  /* Re-run IntersectionObserver on the newly rendered cards */
  var newCards = grid.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && newCards.length) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    newCards.forEach(function (el) { obs.observe(el); });
  } else {
    newCards.forEach(function (el) { el.classList.add('visible'); });
  }

  /* Touch quick-view toggle (mobile: tap to open) */
  if (window.matchMedia('(hover: none)').matches) {
    grid.querySelectorAll('.product-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.qv-actions a')) return;
        var wasOpen = card.classList.contains('open');
        grid.querySelectorAll('.product-card.open').forEach(function (c) {
          c.classList.remove('open');
        });
        if (!wasOpen) card.classList.add('open');
      });
    });
  }

})();
