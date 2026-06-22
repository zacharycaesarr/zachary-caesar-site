/* ================================================================
   product-modal.js — full-screen product detail pop-out
   ================================================================ */

(function () {
  'use strict';

  var overlay   = document.getElementById('zc-pd-overlay');
  var modal     = document.getElementById('zc-product-modal');
  var closeBtn  = document.getElementById('zc-pd-close');
  var mainImg   = document.getElementById('pd-main-img');
  var thumbsEl  = document.getElementById('pd-thumbs');
  var titleEl   = document.getElementById('pd-title');
  var priceEl   = document.getElementById('pd-price');
  var descEl    = document.getElementById('pd-desc');
  var optionsEl = document.getElementById('pd-options');
  var addBtn    = document.getElementById('pd-add-cart');

  if (!modal || !overlay) return;

  var activeHandle = null;
  var selections   = {};
  var gallery      = [];

  var COLOR_MAP = {
    black: '#1a1a1a', white: '#f5f5f0', red: '#8b1a1a',
    navy: '#1a2744', 'navy blue': '#1a2744', camel: '#c4a574',
    'gray coffee': '#6b5d52', olive: '#5c6b3c', 'olive green': '#5c6b3c', tan: '#c9a66b'
  };

  var SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'XXL'];

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function stripHtml(html) {
    var t = document.createElement('div');
    t.innerHTML = html;
    return (t.textContent || t.innerText || '').trim();
  }

  function sortSizes(values) {
    return values.slice().sort(function (a, b) {
      var ia = SIZE_ORDER.indexOf(a.toUpperCase());
      var ib = SIZE_ORDER.indexOf(b.toUpperCase());
      if (ia === -1) ia = 999;
      if (ib === -1) ib = 999;
      if (ia !== ib) return ia - ib;
      return a.localeCompare(b);
    });
  }

  function getProduct() {
    return window.ZC_PRODUCT_CACHE[activeHandle] || null;
  }

  function resolveVariant(product, sel) {
    return window.ZCShopify.findVariant(product, sel);
  }

  function buildGallery(product, sel) {
    var urls = [];
    if (product.mockupImage) urls.push(product.mockupImage);
    (product.images || []).forEach(function (u) { if (u && urls.indexOf(u) === -1) urls.push(u); });
    product.variants.forEach(function (v) {
      if (v.image && urls.indexOf(v.image) === -1) urls.push(v.image);
    });
    var current = variantImage(product, sel);
    if (current && urls.indexOf(current) === -1) {
      urls.unshift(current);
    } else if (current) {
      urls = urls.filter(function (u) { return u !== current; });
      urls.unshift(current);
    }
    return urls.length ? urls : (product.image ? [product.image] : []);
  }

  function variantImage(product, sel) {
    var v = resolveVariant(product, sel);
    if (v && v.image) return v.image;
    if (product.mockupImage) return product.mockupImage;
    return product.image;
  }

  function defaultSelections(product) {
    var sel = {};
    (product.options || []).forEach(function (opt) {
      if (!opt.values || !opt.values.length) return;
      var isSize = opt.name.toLowerCase().indexOf('size') !== -1;
      if (isSize) {
        var sorted = sortSizes(opt.values);
        sel[opt.name] = sorted[0];
      } else {
        sel[opt.name] = opt.values[0];
      }
    });
    return sel;
  }

  function setMainImage(url) {
    if (!mainImg || !url) return;
    mainImg.src = url;
    mainImg.alt = titleEl ? titleEl.textContent : '';
    thumbsEl.querySelectorAll('.pd-thumb').forEach(function (t) {
      t.classList.toggle('selected', t.getAttribute('data-url') === url);
    });
  }

  function renderThumbs() {
    if (!thumbsEl) return;
    if (gallery.length <= 1) {
      thumbsEl.innerHTML = '';
      thumbsEl.hidden = true;
      return;
    }
    thumbsEl.hidden = false;
    thumbsEl.innerHTML = gallery.map(function (url, i) {
      var sel = i === 0 ? ' selected' : '';
      return '<button type="button" class="pd-thumb' + sel + '" data-url="' + esc(url) + '" aria-label="View image ' + (i + 1) + '"><img src="' + esc(url) + '" alt="" loading="lazy" /></button>';
    }).join('');
  }

  function renderOptions(product) {
    var html = [];

    (product.options || []).forEach(function (opt) {
      var name = opt.name;
      var isColor = name.toLowerCase().indexOf('color') !== -1 || name.toLowerCase().indexOf('colour') !== -1;
      var isSize  = name.toLowerCase().indexOf('size') !== -1;
      var values  = isSize ? sortSizes(opt.values) : opt.values;

      html.push('<div class="pd-option-group"><span class="qv-option-label">' + esc(name.toUpperCase()) + '</span>');

      if (isColor) {
        html.push('<div class="qv-colors pd-colors">');
        values.forEach(function (val) {
          var sel = selections[name] === val ? ' selected' : '';
          var swatch = COLOR_MAP[val.toLowerCase()] || '#ccc';
          var v = product.variants.find(function (vv) { return vv.options[name] === val; });
          var style = v && v.image
            ? 'background-image:url(' + v.image + ');background-size:cover'
            : 'background-color:' + swatch;
          html.push('<button type="button" class="qv-color' + sel + '" data-option="' + esc(name) + '" data-value="' + esc(val) + '" style="' + style + '" title="' + esc(val) + '"></button>');
        });
        html.push('</div>');
      } else {
        html.push('<div class="qv-sizes pd-sizes">');
        values.forEach(function (val) {
          var sel = selections[name] === val ? ' selected' : '';
          var test = Object.assign({}, selections);
          test[name] = val;
          var v = resolveVariant(product, test);
          var disabled = v && !v.available ? ' disabled' : '';
          html.push('<button type="button" class="qv-size' + sel + disabled + '" data-option="' + esc(name) + '" data-value="' + esc(val) + '">' + esc(val) + '</button>');
        });
        html.push('</div>');
      }

      html.push('</div>');
    });

    optionsEl.innerHTML = html.join('');
  }

  function updateModalUI() {
    var product = getProduct();
    if (!product) return;

    var variant = resolveVariant(product, selections);
    var price = variant ? window.ZCShopify.formatMoney(variant.price) : product.price;

    priceEl.textContent = price;
    gallery = buildGallery(product, selections);
    renderThumbs();
    setMainImage(gallery[0] || variantImage(product, selections));
    renderOptions(product);

    var wrap = modal.querySelector('.pd-main-wrap');
    if (wrap) {
      wrap.classList.toggle('pd-main-wrap--mockup', !!product.mockupImage);
      wrap.classList.toggle('pd-main-wrap--blend', !!product.useBlend && !product.mockupImage);
    }
  }

  function open(handle, initialSelections) {
    var product = window.ZC_PRODUCT_CACHE[handle];
    if (!product) return;

    activeHandle = handle;
    selections = initialSelections ? Object.assign({}, initialSelections) : defaultSelections(product);

    titleEl.textContent = product.name;
    descEl.textContent = product.description
      ? stripHtml(product.description).slice(0, 320)
      : '';
    descEl.hidden = !product.description;

    updateModalUI();

    overlay.classList.add('open');
    modal.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('pd-open');
  }

  function close() {
    overlay.classList.remove('open');
    modal.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('pd-open');
    activeHandle = null;
  }

  function addToCart() {
    var product = getProduct();
    if (!product) return;
    var variant = resolveVariant(product, selections);
    if (!variant) { alert('Please select all options.'); return; }
    if (!variant.available) { alert('This combination is sold out.'); return; }

    addBtn.classList.add('adding');
    setTimeout(function () { addBtn.classList.remove('adding'); }, 550);

    if (window.ZC_CART) {
      window.ZC_CART.addVariant({
        variantId: variant.id,
        productHandle: activeHandle,
        title: product.name,
        variantTitle: Object.values(variant.options).join(' / '),
        price: variant.price,
        image: variant.image || product.image
      });
    }
  }

  /* ── Events ───────────────────────────────────── */
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  if (addBtn) addBtn.addEventListener('click', addToCart);

  optionsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.qv-color, .qv-size');
    if (!btn || btn.disabled) return;
    selections[btn.getAttribute('data-option')] = btn.getAttribute('data-value');
    updateModalUI();
  });

  thumbsEl.addEventListener('click', function (e) {
    var thumb = e.target.closest('.pd-thumb');
    if (!thumb) return;
    setMainImage(thumb.getAttribute('data-url'));
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });

  window.ZC_PRODUCT_MODAL = { open: open, close: close };

})();
