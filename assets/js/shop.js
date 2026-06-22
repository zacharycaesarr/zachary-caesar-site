/* ================================================================
   shop.js — fetches products + variants live from Shopify
   Optional tweaks: data/product-overrides.js
   ================================================================ */

(function () {
  'use strict';

  var grid = document.getElementById('zc-product-grid');
  if (!grid) return;

  window.ZC_PRODUCT_CACHE = {};

  var COLOR_MAP = {
    black: '#1a1a1a',
    white: '#f5f5f0',
    red: '#8b1a1a',
    navy: '#1a2744',
    'navy blue': '#1a2744',
    camel: '#c4a574',
    'gray coffee': '#6b5d52',
    olive: '#5c6b3c',
    'olive green': '#5c6b3c',
    tan: '#c9a66b'
  };

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function showLoading() {
    grid.innerHTML = '<p class="shop-status">LOADING DROP…</p>';
  }

  function showError(msg) {
    grid.innerHTML = [
      '<div class="shop-status shop-status--error">',
      '  <p>COULD NOT LOAD PRODUCTS</p>',
      '  <p class="shop-status-detail">' + esc(msg) + '</p>',
      '  <p class="shop-status-hint">Make sure each product is published to the <strong>Headless</strong> sales channel in Shopify Admin.</p>',
      '</div>'
    ].join('');
  }

  function getDefaultSelections(product) {
    var sel = {};
    (product.options || []).forEach(function (opt) {
      if (opt.values && opt.values.length) {
        sel[opt.name] = opt.values[0];
      }
    });
    return sel;
  }

  function resolveVariant(product, selections) {
    return window.ZCShopify.findVariant(product, selections);
  }

  function variantImage(product, selections) {
    var v = resolveVariant(product, selections);
    if (v && v.image) return v.image;
    var color = selections.Color || selections.Colour || selections.color;
    if (color) {
      var match = product.variants.find(function (vv) {
        return vv.options.Color === color || vv.options.Colour === color;
      });
      if (match && match.image) return match.image;
    }
    return product.mockupImage || product.image;
  }

  function buildImageHtml(product, imgUrl) {
    var ribbon = product.ribbon
      ? '<span class="product-ribbon">' + esc(product.ribbon) + '</span>'
      : '';

    if (product.mockupImage) {
      return [
        '<div class="product-img product-img--mockup">',
        '  <div class="product-mockup-bg"></div>',
        '  <img class="product-mockup product-card-img" src="' + esc(product.mockupImage) + '" alt="' + esc(product.name) + '" loading="lazy" />',
        '  ' + ribbon,
        '</div>'
      ].join('\n');
    }

    if (imgUrl) {
      return [
        '<div class="product-img">',
        '  <img class="product-card-img" src="' + esc(imgUrl) + '" alt="' + esc(product.name) + '" loading="lazy" />',
        '  ' + ribbon,
        '</div>'
      ].join('\n');
    }

    return [
      '<div class="product-img">',
      '  <div class="product-img-placeholder">NO IMAGE</div>',
      '  ' + ribbon,
      '</div>'
    ].join('\n');
  }

  function buildOptionPickers(product, selections) {
    var html = [];

    (product.options || []).forEach(function (opt) {
      var name = opt.name;
      var isColor = name.toLowerCase().indexOf('color') !== -1 || name.toLowerCase().indexOf('colour') !== -1;

      if (isColor) {
        html.push('<div class="qv-option-group"><span class="qv-option-label">' + esc(name.toUpperCase()) + '</span>');
        html.push('<div class="qv-colors" data-option="' + esc(name) + '">');
        opt.values.forEach(function (val, i) {
          var sel = selections[name] === val ? ' selected' : '';
          var swatch = COLOR_MAP[val.toLowerCase()] || '#ccc';
          var v = product.variants.find(function (vv) { return vv.options[name] === val; });
          var style = v && v.image
            ? 'background-image:url(' + v.image + ');background-size:cover'
            : 'background-color:' + swatch;
          html.push(
            '<button type="button" class="qv-color' + sel + '" data-option="' + esc(name) + '" data-value="' + esc(val) + '" title="' + esc(val) + '" style="' + style + '" aria-label="' + esc(val) + '"></button>'
          );
        });
        html.push('</div></div>');
      } else {
        html.push('<div class="qv-option-group"><span class="qv-option-label">' + esc(name.toUpperCase()) + '</span>');
        html.push('<div class="qv-sizes" data-option="' + esc(name) + '">');
        opt.values.forEach(function (val) {
          var sel = selections[name] === val ? ' selected' : '';
          var testSel = Object.assign({}, selections, {});
          testSel[name] = val;
          var variant = resolveVariant(product, testSel);
          var disabled = variant && !variant.available ? ' disabled' : '';
          html.push(
            '<button type="button" class="qv-size' + sel + disabled + '" data-option="' + esc(name) + '" data-value="' + esc(val) + '">' + esc(val) + '</button>'
          );
        });
        html.push('</div></div>');
      }
    });

    return html.join('');
  }

  function buildCard(product, index) {
    var selections = getDefaultSelections(product);
    var variant = resolveVariant(product, selections);
    var price = variant ? window.ZCShopify.formatMoney(variant.price) : product.price;
    var imgUrl = variantImage(product, selections);
    var delay = index < 4 ? ' data-delay="' + index + '"' : '';

    window.ZC_PRODUCT_CACHE[product.handle] = product;

    return [
      '<div class="product-card" data-reveal' + delay + ' data-product-handle="' + esc(product.handle) + '" data-selections=\'' + JSON.stringify(selections).replace(/'/g, '&#39;') + '\'>',
      '  ' + buildImageHtml(product, imgUrl),
      '  <div class="product-info">',
      '    <span class="product-name">' + esc(product.name) + '</span>',
      '    <span class="product-price" data-price>' + esc(price) + '</span>',
      '  </div>',
      '  <div class="quick-view">',
      '    <span class="qv-name">' + esc(product.name) + '</span>',
      '    <span class="qv-price" data-price>' + esc(price) + '</span>',
      '    <div class="qv-options">' + buildOptionPickers(product, selections) + '</div>',
      '    <div class="qv-actions">',
      '      <button type="button" class="btn btn-fill btn-add-cart" data-product-handle="' + esc(product.handle) + '">ADD TO CART</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  function getCardSelections(card) {
    try {
      return JSON.parse(card.getAttribute('data-selections') || '{}');
    } catch (e) {
      return {};
    }
  }

  function setCardSelections(card, selections) {
    card.setAttribute('data-selections', JSON.stringify(selections));
  }

  function updateCardUI(card) {
    var handle = card.getAttribute('data-product-handle');
    var product = window.ZC_PRODUCT_CACHE[handle];
    if (!product) return;

    var selections = getCardSelections(card);
    var variant = resolveVariant(product, selections);
    var price = variant ? window.ZCShopify.formatMoney(variant.price) : product.price;
    var imgUrl = variantImage(product, selections);

    card.querySelectorAll('[data-price]').forEach(function (el) {
      el.textContent = price;
    });

    if (!product.mockupImage) {
      var img = card.querySelector('.product-card-img');
      if (img && imgUrl) img.src = imgUrl;
    }

    card.querySelectorAll('.qv-color, .qv-size').forEach(function (btn) {
      var opt = btn.getAttribute('data-option');
      var val = btn.getAttribute('data-value');
      btn.classList.toggle('selected', selections[opt] === val);
    });

    /* Refresh size availability for current color */
    card.querySelectorAll('.qv-size').forEach(function (btn) {
      var opt = btn.getAttribute('data-option');
      var val = btn.getAttribute('data-value');
      var testSel = Object.assign({}, selections);
      testSel[opt] = val;
      var v = resolveVariant(product, testSel);
      btn.disabled = !!(v && !v.available);
    });
  }

  function initReveal() {
    var cards = grid.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window && cards.length) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.08 });
      cards.forEach(function (el) { obs.observe(el); });
    } else {
      cards.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  function bindEvents() {
    grid.addEventListener('click', function (e) {
      var colorBtn = e.target.closest('.qv-color');
      var sizeBtn  = e.target.closest('.qv-size');

      if (colorBtn || sizeBtn) {
        var btn = colorBtn || sizeBtn;
        if (btn.disabled) return;
        var card = btn.closest('.product-card');
        var opt = btn.getAttribute('data-option');
        var val = btn.getAttribute('data-value');
        var selections = getCardSelections(card);
        selections[opt] = val;
        setCardSelections(card, selections);
        updateCardUI(card);
        e.stopPropagation();
        return;
      }

      var addBtn = e.target.closest('.btn-add-cart');
      if (addBtn) {
        e.preventDefault();
        e.stopPropagation();
        var card = addBtn.closest('.product-card');
        var handle = addBtn.getAttribute('data-product-handle');
        var product = window.ZC_PRODUCT_CACHE[handle];
        var selections = getCardSelections(card);
        var variant = resolveVariant(product, selections);

        if (!variant) {
          alert('Please select all options.');
          return;
        }
        if (!variant.available) {
          alert('This combination is sold out.');
          return;
        }

        addBtn.classList.add('adding');
        setTimeout(function () { addBtn.classList.remove('adding'); }, 550);

        if (window.ZC_CART) {
          window.ZC_CART.addVariant({
            variantId: variant.id,
            productHandle: handle,
            title: product.name,
            variantTitle: Object.values(variant.options).join(' / '),
            price: variant.price,
            image: variant.image || product.image
          });
        }
        return;
      }

      if (window.matchMedia('(hover: none)').matches) {
        var card = e.target.closest('.product-card');
        if (!card || e.target.closest('.qv-actions, .qv-options, .btn-add-cart')) return;
        var wasOpen = card.classList.contains('open');
        grid.querySelectorAll('.product-card.open').forEach(function (c) { c.classList.remove('open'); });
        if (!wasOpen) card.classList.add('open');
      }
    });
  }

  function render(products) {
    if (!products.length) {
      grid.innerHTML = '<p class="shop-status">NO PRODUCTS YET — add items in Tapstitch/Shopify and publish to Headless.</p>';
      return;
    }
    grid.innerHTML = products.map(buildCard).join('');
    initReveal();
    bindEvents();
  }

  function init() {
    showLoading();

    if (!window.ZCShopify || !window.ZCShopify.isReady()) {
      showError('Shopify is not configured. Check data/shop-config.js');
      return;
    }

    window.ZCShopify.fetchProducts()
      .then(render)
      .catch(function (err) {
        console.error('[ZC Shop]', err);
        showError(err.message || 'Unknown error');
      });
  }

  init();

})();
