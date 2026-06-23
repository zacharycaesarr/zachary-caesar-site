/* ================================================================
   product-modal.js — product detail pop-out
   ================================================================ */

(function () {
  'use strict';

  var overlay    = document.getElementById('zc-pd-overlay');
  var modal      = document.getElementById('zc-product-modal');
  var closeBtn   = document.getElementById('zc-pd-close');
  var mainWrap   = document.getElementById('pd-main-wrap');
  var mainImg    = document.getElementById('pd-main-img');
  var thumbsEl   = document.getElementById('pd-thumbs');
  var counterEl  = document.getElementById('pd-img-counter');
  var prevBtn    = document.getElementById('pd-prev');
  var nextBtn    = document.getElementById('pd-next');
  var titleEl    = document.getElementById('pd-title');
  var priceEl    = document.getElementById('pd-price');
  var descEl     = document.getElementById('pd-desc');
  var guideEl    = document.getElementById('pd-size-guide');
  var guideBody  = document.getElementById('pd-size-guide-content');
  var optionsEl  = document.getElementById('pd-options');
  var addBtn     = document.getElementById('pd-add-cart');

  if (!modal || !overlay) return;

  var activeHandle = null;
  var selections   = {};
  var gallery      = [];
  var galleryIndex = 0;
  var touchStartX  = 0;

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

  /* All product media — front, back, every angle from Shopify */
  function buildGallery(product) {
    var seen = {};
    var urls = [];

    function add(u) {
      if (!u || seen[u]) return;
      seen[u] = true;
      urls.push(u);
    }

    if (product.mockupImage) add(product.mockupImage);
    (product.images || []).forEach(add);
    product.variants.forEach(function (v) { add(v.image); });
    add(product.image);

    return urls;
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
      sel[opt.name] = isSize ? sortSizes(opt.values)[0] : opt.values[0];
    });
    return sel;
  }

  function showGalleryIndex(i) {
    if (!gallery.length) return;
    galleryIndex = ((i % gallery.length) + gallery.length) % gallery.length;
    var url = gallery[galleryIndex];
    mainImg.src = url;
    mainImg.alt = titleEl ? titleEl.textContent : '';

    if (counterEl) {
      counterEl.textContent = gallery.length > 1
        ? (galleryIndex + 1) + ' / ' + gallery.length
        : '';
    }

    thumbsEl.querySelectorAll('.pd-thumb').forEach(function (t, idx) {
      t.classList.toggle('selected', idx === galleryIndex);
    });

    if (prevBtn) prevBtn.hidden = gallery.length <= 1;
    if (nextBtn) nextBtn.hidden = gallery.length <= 1;
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
      var sel = i === galleryIndex ? ' selected' : '';
      return '<button type="button" class="pd-thumb' + sel + '" data-idx="' + i + '" aria-label="Image ' + (i + 1) + '"><img src="' + esc(url) + '" alt="" loading="lazy" /></button>';
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

    gallery = buildGallery(product);
    renderThumbs();

    var vImg = variantImage(product, selections);
    var startIdx = vImg ? gallery.indexOf(vImg) : 0;
    showGalleryIndex(startIdx >= 0 ? startIdx : 0);

    renderOptions(product);

    if (mainWrap) {
      mainWrap.classList.toggle('pd-main-wrap--mockup', !!product.mockupImage);
    }
  }

  function open(handle, initialSelections) {
    var product = window.ZC_PRODUCT_CACHE[handle];
    if (!product) return;

    activeHandle = handle;
    selections = initialSelections ? Object.assign({}, initialSelections) : defaultSelections(product);
    galleryIndex = 0;

    titleEl.textContent = product.name;

    var summary = product.shortDescription || '';
    /* Safety: never show size-guide data in description slot */
    if (/\bLength\b/i.test(summary) && /\bChest\b/i.test(summary)) summary = '';
    if (/\binch\b/i.test(summary) && /\bcm\b/i.test(summary)) summary = '';

    descEl.textContent = summary;
    descEl.hidden = !summary;

    if (product.sizeGuideHtml && guideBody && guideEl) {
      guideBody.innerHTML = product.sizeGuideHtml;
      guideEl.hidden = false;
    } else if (guideEl) {
      guideBody.innerHTML = '';
      guideEl.hidden = true;
    }

    updateModalUI();

    overlay.classList.add('open');
    modal.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('pd-open');
    modal.scrollTop = 0;
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

  /* ── Swipe gallery ─────────────────────────────── */
  if (mainWrap) {
    mainWrap.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    mainWrap.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 42) {
        showGalleryIndex(galleryIndex + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { showGalleryIndex(galleryIndex - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { showGalleryIndex(galleryIndex + 1); });

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
    showGalleryIndex(parseInt(thumb.getAttribute('data-idx'), 10));
  });

  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') showGalleryIndex(galleryIndex - 1);
    if (e.key === 'ArrowRight') showGalleryIndex(galleryIndex + 1);
  });

  window.ZC_PRODUCT_MODAL = { open: open, close: close };

})();
