/* ================================================================
   shop.js — renders product cards + wires add-to-cart
   Product data: data/products.js
   Cart: assets/js/cart.js
   ================================================================ */

(function () {
  var grid = document.getElementById('zc-product-grid');
  if (!grid) return;

  var products = window.ZC_PRODUCTS;
  if (!products || !products.length) {
    grid.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px">No products yet.</p>';
    return;
  }

  function buildImage(p) {
    if (p.mockupImage) {
      return [
        '<div class="product-img product-img--mockup">',
        '  <div class="product-mockup-bg"></div>',
        '  <img class="product-mockup" src="' + p.mockupImage + '" alt="' + p.name + '" loading="lazy" />',
        '</div>'
      ].join('\n');
    }
    if (p.image) {
      return '<div class="product-img"><img src="' + p.image + '" alt="' + p.name + '" loading="lazy" /></div>';
    }
    return '<div class="product-img"><div class="product-img-placeholder">ADD PRODUCT IMAGE</div></div>';
  }

  function buildSizes(p) {
    if (!p.sizes || !p.sizes.length) return '';
    var btns = p.sizes.map(function (s, i) {
      var sel = i === 0 ? ' selected' : '';
      return '<button type="button" class="qv-size' + sel + '" data-size="' + s + '">' + s + '</button>';
    }).join('');
    return '<div class="qv-sizes" data-product="' + p.id + '">' + btns + '</div>';
  }

  var html = products.map(function (p, i) {
    var ribbon = p.ribbon ? '<span class="product-ribbon">' + p.ribbon + '</span>' : '';
    var delay  = i < 4 ? ' data-delay="' + i + '"' : '';
    var imgBlock = buildImage(p);
    var imgInner = imgBlock.indexOf('product-img--mockup') > -1
      ? imgBlock
      : imgBlock.replace('<div class="product-img">', '<div class="product-img">').replace('</div>', ribbon + '</div>');

    /* Wrap ribbon inside product-img for mockup layout */
    if (p.mockupImage) {
      imgInner = imgBlock.replace('</div>\n', ribbon + '</div>\n');
    } else if (p.image) {
      imgInner = [
        '<div class="product-img">',
        '  <img src="' + p.image + '" alt="' + p.name + '" loading="lazy" />',
        '  ' + ribbon,
        '</div>'
      ].join('\n');
    } else {
      imgInner = [
        '<div class="product-img">',
        '  <div class="product-img-placeholder">ADD PRODUCT IMAGE</div>',
        '  ' + ribbon,
        '</div>'
      ].join('\n');
    }

    return [
      '<div class="product-card" data-reveal' + delay + ' data-product-id="' + p.id + '">',
      '  ' + imgInner,
      '  <div class="product-info">',
      '    <span class="product-name">' + p.name + '</span>',
      '    <span class="product-price">' + p.price + '</span>',
      '  </div>',
      '  <div class="quick-view">',
      '    <span class="qv-name">' + p.name + '</span>',
      '    <span class="qv-price">' + p.price + '</span>',
      '    ' + buildSizes(p),
      '    <div class="qv-actions">',
      '      <button type="button" class="btn btn-fill btn-add-cart" data-product-id="' + p.id + '">ADD TO CART</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
  });

  grid.innerHTML = html.join('\n');

  /* IntersectionObserver for reveal animations */
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

  /* Size selection */
  grid.addEventListener('click', function (e) {
    var sizeBtn = e.target.closest('.qv-size');
    if (sizeBtn) {
      var group = sizeBtn.closest('.qv-sizes');
      group.querySelectorAll('.qv-size').forEach(function (b) { b.classList.remove('selected'); });
      sizeBtn.classList.add('selected');
      e.stopPropagation();
    }
  });

  /* Add to cart */
  grid.addEventListener('click', function (e) {
    var addBtn = e.target.closest('.btn-add-cart');
    if (!addBtn) return;
    e.preventDefault();
    e.stopPropagation();

    var productId = addBtn.getAttribute('data-product-id');
    var card = addBtn.closest('.product-card');
    var sizeEl = card ? card.querySelector('.qv-size.selected') : null;
    var size = sizeEl ? sizeEl.getAttribute('data-size') : '';

    addBtn.classList.add('adding');
    setTimeout(function () { addBtn.classList.remove('adding'); }, 550);

    if (window.ZC_CART) {
      window.ZC_CART.add(productId, size);
    }
  });

  /* Mobile quick-view toggle */
  if (window.matchMedia('(hover: none)').matches) {
    grid.querySelectorAll('.product-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.qv-actions, .qv-sizes, .btn-add-cart')) return;
        var wasOpen = card.classList.contains('open');
        grid.querySelectorAll('.product-card.open').forEach(function (c) { c.classList.remove('open'); });
        if (!wasOpen) card.classList.add('open');
      });
    });
  }

})();
