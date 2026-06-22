/* ================================================================
   cart.js — On-site cart drawer + Shopify checkout
   ================================================================ */

(function () {
  'use strict';

  var STORAGE_KEY  = 'zc_cart_v1';
  var CART_ID_KEY  = 'zc_shopify_cart_id';
  var cfg          = window.ZC_SHOP_CONFIG || {};
  var sym          = cfg.currencySymbol || '$';

  var drawer      = document.getElementById('zc-cart-drawer');
  var overlay     = document.getElementById('zc-cart-overlay');
  var trigger     = document.getElementById('zc-cart-trigger');
  var closeBtn    = document.getElementById('zc-cart-close');
  var itemsEl     = document.getElementById('zc-cart-items');
  var emptyEl     = document.getElementById('zc-cart-empty');
  var footerEl    = document.getElementById('zc-cart-footer');
  var totalEl     = document.getElementById('zc-cart-total');
  var checkoutBtn = document.getElementById('zc-cart-checkout');
  var countEls    = document.querySelectorAll('.cart-count');
  var demoBanner  = document.getElementById('zc-cart-demo-banner');

  if (!drawer) return;

  var state = loadLocal();
  var shopifyCartId = localStorage.getItem(CART_ID_KEY) || null;
  var busy = false;

  function loadLocal() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { items: [], checkoutUrl: null };
    } catch (e) {
      return { items: [], checkoutUrl: null };
    }
  }

  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function formatMoney(n) {
    return sym + parseFloat(n).toFixed(2);
  }

  function totalQty() {
    return state.items.reduce(function (sum, i) { return sum + i.quantity; }, 0);
  }

  function subtotal() {
    return state.items.reduce(function (sum, i) { return sum + i.price * i.quantity; }, 0);
  }

  function updateCount() {
    var n = totalQty();
    countEls.forEach(function (el) {
      el.textContent = n;
      el.classList.toggle('cart-count--pop', false);
      if (n > 0) {
        void el.offsetWidth;
        el.classList.add('cart-count--pop');
      }
    });
  }

  function render() {
    var hasItems = state.items.length > 0;

    if (demoBanner) {
      demoBanner.style.display = (window.ZCShopify && window.ZCShopify.isReady()) ? 'none' : 'block';
    }

    if (!hasItems) {
      itemsEl.innerHTML = '';
      emptyEl.hidden = false;
      footerEl.hidden = true;
      updateCount();
      return;
    }

    emptyEl.hidden = true;
    footerEl.hidden = false;
    totalEl.textContent = formatMoney(subtotal());

    itemsEl.innerHTML = state.items.map(function (item, idx) {
      var img = item.image
        ? '<img src="' + item.image + '" alt="" class="cart-item-img" />'
        : '<div class="cart-item-img cart-item-img--placeholder"></div>';
      var variant = item.variantTitle
        ? '<span class="cart-item-variant">' + item.variantTitle + '</span>'
        : '';

      return [
        '<div class="cart-item" data-idx="' + idx + '">',
        '  ' + img,
        '  <div class="cart-item-body">',
        '    <span class="cart-item-name">' + item.title + '</span>',
        '    ' + variant,
        '    <span class="cart-item-price">' + formatMoney(item.price * item.quantity) + '</span>',
        '    <div class="cart-item-qty">',
        '      <button type="button" class="cart-qty-btn" data-action="minus" data-idx="' + idx + '" aria-label="Decrease quantity">−</button>',
        '      <span class="cart-qty-num">' + item.quantity + '</span>',
        '      <button type="button" class="cart-qty-btn" data-action="plus" data-idx="' + idx + '" aria-label="Increase quantity">+</button>',
        '    </div>',
        '  </div>',
        '  <button type="button" class="cart-item-remove" data-idx="' + idx + '" aria-label="Remove item">×</button>',
        '</div>'
      ].join('\n');
    }).join('');

    updateCount();
  }

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-open');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-open');
  }

  function syncShopifyAdd(variantId, meta) {
    if (busy) return Promise.resolve();
    busy = true;

    var promise = shopifyCartId
      ? window.ZCShopify.addToCart(shopifyCartId, variantId, 1)
      : window.ZCShopify.createCart().then(function (cart) {
          shopifyCartId = cart.id;
          localStorage.setItem(CART_ID_KEY, shopifyCartId);
          return window.ZCShopify.addToCart(shopifyCartId, variantId, 1);
        });

    return promise.then(function (cart) {
      shopifyCartId = cart.id;
      state.checkoutUrl = cart.checkoutUrl;
      state.items = cart.lines.map(function (line) {
        return {
          title: line.title,
          variantTitle: line.variantTitle,
          price: line.price,
          quantity: line.quantity,
          lineId: line.lineId,
          variantId: line.variantId,
          image: line.image || (meta && meta.image)
        };
      });
      saveLocal();
      render();
      openDrawer();
      pulseAdded();
    }).catch(function (err) {
      console.error('[ZC Cart]', err);
      alert('Could not add to cart: ' + (err.message || 'Check Shopify config'));
    }).finally(function () {
      busy = false;
    });
  }

  function addVariant(meta) {
    if (!meta || !meta.variantId) {
      return Promise.reject(new Error('No variant selected'));
    }

    if (window.ZCShopify && window.ZCShopify.isReady()) {
      return syncShopifyAdd(meta.variantId, meta);
    }

    var existing = state.items.find(function (i) {
      return i.variantId === meta.variantId;
    });

    if (existing) {
      existing.quantity += 1;
    } else {
      state.items.push({
        variantId: meta.variantId,
        title: meta.title,
        variantTitle: meta.variantTitle || '',
        price: meta.price,
        quantity: 1,
        image: meta.image,
        lineId: null
      });
    }

    saveLocal();
    render();
    openDrawer();
    pulseAdded();
    return Promise.resolve();
  }

  function pulseAdded() {
    drawer.classList.add('cart-drawer--added');
    setTimeout(function () { drawer.classList.remove('cart-drawer--added'); }, 600);
  }

  function changeQty(idx, delta) {
    var item = state.items[idx];
    if (!item) return;

    var newQty = item.quantity + delta;

    if (window.ZCShopify && window.ZCShopify.isReady() && item.lineId && shopifyCartId) {
      if (newQty <= 0) {
        window.ZCShopify.removeLine(shopifyCartId, [item.lineId]).then(applyShopifyCart);
      } else {
        window.ZCShopify.updateLine(shopifyCartId, item.lineId, newQty).then(applyShopifyCart);
      }
      return;
    }

    if (newQty <= 0) {
      state.items.splice(idx, 1);
    } else {
      item.quantity = newQty;
    }
    saveLocal();
    render();
  }

  function removeItem(idx) {
    changeQty(idx, -999);
  }

  function applyShopifyCart(cart) {
    if (!cart) return;
    state.checkoutUrl = cart.checkoutUrl;
    state.items = cart.lines.map(function (line) {
      return {
        title: line.title,
        variantTitle: line.variantTitle,
        price: line.price,
        quantity: line.quantity,
        lineId: line.lineId,
        variantId: line.variantId,
        image: line.image
      };
    });
    saveLocal();
    render();
  }

  function checkout() {
    if (!state.items.length) return;

    if (state.checkoutUrl) {
      window.location.href = state.checkoutUrl;
      return;
    }

    if (window.ZCShopify && window.ZCShopify.isReady()) {
      alert('Add an item to cart first to generate checkout.');
      return;
    }

    alert('Shop is in DEMO MODE. Configure Shopify in data/shop-config.js');
  }

  if (trigger) trigger.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);
  if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  itemsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (btn) {
      changeQty(parseInt(btn.getAttribute('data-idx'), 10), btn.getAttribute('data-action') === 'plus' ? 1 : -1);
      return;
    }
    var remove = e.target.closest('.cart-item-remove');
    if (remove) removeItem(parseInt(remove.getAttribute('data-idx'), 10));
  });

  /* Restore Shopify cart on load */
  if (window.ZCShopify && window.ZCShopify.isReady() && shopifyCartId) {
    window.ZCShopify.getCart(shopifyCartId).then(applyShopifyCart).catch(function () {
      localStorage.removeItem(CART_ID_KEY);
      shopifyCartId = null;
    });
  }

  window.ZC_CART = {
    addVariant: addVariant,
    open: openDrawer,
    close: closeDrawer,
    getCount: totalQty
  };

  render();

})();
