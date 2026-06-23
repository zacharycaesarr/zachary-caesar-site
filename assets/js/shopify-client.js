/* ================================================================
   shopify-client.js
   Storefront API — products, variants, cart, checkout
   ================================================================ */

(function () {
  'use strict';

  var cfg = window.ZC_SHOP_CONFIG || {};
  var API_VERSION = '2024-10';

  var PRODUCT_FIELDS = [
    'id',
    'handle',
    'title',
    'description',
    'featuredImage { url altText }',
    'images(first: 50) { edges { node { url altText } } }',
    'media(first: 50) { edges { node { mediaContentType ... on MediaImage { image { url altText } } } } }',
    'priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }',
    'options { name values }',
    'variants(first: 100) {',
    '  edges { node {',
    '    id',
    '    title',
    '    availableForSale',
    '    price { amount currencyCode }',
    '    image { url altText }',
    '    selectedOptions { name value }',
    '  } }',
    '}'
  ].join('\n');

  function isReady() {
    return cfg.enabled && cfg.storeDomain && cfg.storefrontAccessToken;
  }

  function endpoint() {
    return 'https://' + cfg.storeDomain + '/api/' + API_VERSION + '/graphql.json';
  }

  function gql(query, variables) {
    return fetch(endpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': cfg.storefrontAccessToken
      },
      body: JSON.stringify({ query: query, variables: variables || {} })
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (json.errors && json.errors.length) {
          throw new Error(json.errors[0].message);
        }
        return json.data;
      });
  }

  function formatMoney(amount, currencyCode) {
    var sym = cfg.currencySymbol || '$';
    var n = parseFloat(amount);
    if (isNaN(n)) return sym + '0.00';
    return sym + n.toFixed(2);
  }

  function parseVariant(node) {
    var opts = {};
    (node.selectedOptions || []).forEach(function (o) {
      opts[o.name] = o.value;
    });
    return {
      id: node.id,
      title: node.title,
      price: parseFloat(node.price.amount),
      currency: node.price.currencyCode,
      available: node.availableForSale,
      image: node.image ? node.image.url : null,
      options: opts
    };
  }

  function stripTags(html) {
    var el = document.createElement('div');
    el.innerHTML = html;
    return (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim();
  }

  function looksLikeSizeGuide(htmlOrText) {
    if (!htmlOrText) return false;
    var text = stripTags(htmlOrText);
    return (
      /<table/i.test(htmlOrText) ||
      (/\bLength\b/i.test(text) && /\bChest\b/i.test(text)) ||
      (/\binch\b/i.test(text) && /\bcm\b/i.test(text) && /\b(XL|2XL|S\b|M\b|L\b)/i.test(text)) ||
      /\bGender\s*:/i.test(text) ||
      /\bFabric Weight\b/i.test(text) ||
      /\bSleeve length\b/i.test(text)
    );
  }

  function formatSizeGuideHtml(html) {
    if (!html) return '';

    var wrap = document.createElement('div');
    wrap.innerHTML = html;

    var table = wrap.querySelector('table');
    var out   = document.createElement('div');
    out.className = 'zc-size-guide-formatted';

    if (table) {
      table.classList.add('zc-size-table');
      var tableClone = table.cloneNode(true);
      out.appendChild(tableClone);
    }

    /* Garment specs below table (Gender, Fabric, etc.) */
    var specLines = [];
    wrap.querySelectorAll('p, li, span, div').forEach(function (el) {
      if (el.closest('table')) return;
      var t = (el.textContent || '').trim();
      if (!t || t.length > 200) return;
      if (/\b(Gender|Fabric|Features|Thickness)\b/i.test(t)) {
        specLines.push(t);
      }
    });

    if (!specLines.length) {
      var plain = stripTags(html);
      var specMatch = plain.match(/Gender\s*:[\s\S]*/i);
      if (specMatch) specLines.push(specMatch[0].trim());
    }

    if (specLines.length) {
      var ul = document.createElement('ul');
      ul.className = 'zc-garment-specs';
      specLines.forEach(function (line) {
        var li = document.createElement('li');
        li.textContent = line;
        ul.appendChild(li);
      });
      out.appendChild(ul);
    }

    if (!table && !specLines.length) {
      out.innerHTML = html;
    }

    return out.innerHTML;
  }

  function parseDescription(html) {
    if (!html) return { summary: '', sizeGuideHtml: '' };

    if (!looksLikeSizeGuide(html)) {
      return { summary: stripTags(html), sizeGuideHtml: '' };
    }

    var markers = [
      html.search(/<table/i),
      html.search(/\b(S|Size|M|L|XL)\b[\s\S]{0,80}\binch\b/i),
      html.search(/\bLength\b/i),
      html.search(/\bGender\s*:/i)
    ].filter(function (i) { return i >= 0; });

    var splitAt = markers.length ? Math.min.apply(null, markers) : 0;

    if (splitAt <= 0) {
      return { summary: '', sizeGuideHtml: formatSizeGuideHtml(html) };
    }

    var intro   = html.slice(0, splitAt);
    var guide   = html.slice(splitAt);
    var summary = stripTags(intro);
    if (looksLikeSizeGuide(summary)) summary = '';

    return {
      summary: summary,
      sizeGuideHtml: formatSizeGuideHtml(guide)
    };
  }

  function collectImages(node) {
    var seen = {};
    var list = [];

    function add(url) {
      if (!url || seen[url]) return;
      seen[url] = true;
      list.push(url);
    }

    if (node.featuredImage) add(node.featuredImage.url);
    (node.images && node.images.edges || []).forEach(function (e) {
      add(e.node.url);
    });
    (node.media && node.media.edges || []).forEach(function (e) {
      var n = e.node;
      if (n.image) add(n.image.url);
    });

    return list;
  }

  function normalizeProduct(node) {
    var overrides = (window.ZC_PRODUCT_OVERRIDES || {})[node.handle] || {};
    var variants = (node.variants.edges || []).map(function (e) {
      return parseVariant(e.node);
    });

    var minPrice = node.priceRange.minVariantPrice;
    var images = collectImages(node);
    var rawDesc = overrides.description || node.description || '';
    var parsed  = parseDescription(rawDesc);
    var summary = overrides.shortDescription || parsed.summary || '';
    if (looksLikeSizeGuide(summary)) summary = '';

    return {
      id: node.handle,
      handle: node.handle,
      gid: node.id,
      name: overrides.displayName || node.title,
      description: rawDesc,
      shortDescription: summary,
      sizeGuideHtml: parsed.sizeGuideHtml,
      ribbon: overrides.ribbon || '',
      mockupImage: overrides.mockupImage || null,
      image: node.featuredImage ? node.featuredImage.url : null,
      images: images,
      price: formatMoney(minPrice.amount, minPrice.currencyCode),
      priceAmount: parseFloat(minPrice.amount),
      options: node.options || [],
      variants: variants
    };
  }

  function findVariant(product, selections) {
    if (!product || !product.variants) return null;
    return product.variants.find(function (v) {
      return Object.keys(selections).every(function (key) {
        return v.options[key] === selections[key];
      });
    }) || null;
  }

  function getOptionValues(product, optionName) {
    var opt = (product.options || []).find(function (o) {
      return o.name.toLowerCase() === optionName.toLowerCase();
    });
    return opt ? opt.values : [];
  }

  /* ── Product queries ────────────────────────────── */

  function fetchProducts() {
    if (!isReady()) {
      return Promise.reject(new Error('Shopify not configured'));
    }

    var handle = cfg.collectionHandle;

    if (handle) {
      var collectionQuery = [
        'query collectionProducts($handle: String!) {',
        '  collection(handle: $handle) {',
        '    title',
        '    products(first: 50) {',
        '      edges { node { ' + PRODUCT_FIELDS + ' } }',
        '    }',
        '  }',
        '}'
      ].join('\n');

      return gql(collectionQuery, { handle: handle }).then(function (data) {
        if (!data.collection) {
          throw new Error('Collection "' + handle + '" not found. Check collectionHandle in shop-config.js');
        }
        return (data.collection.products.edges || []).map(function (e) {
          return normalizeProduct(e.node);
        });
      });
    }

    var allQuery = [
      'query allProducts {',
      '  products(first: 50) {',
      '    edges { node { ' + PRODUCT_FIELDS + ' } }',
      '  }',
      '}'
    ].join('\n');

    return gql(allQuery).then(function (data) {
      return (data.products.edges || []).map(function (e) {
        return normalizeProduct(e.node);
      });
    });
  }

  /* ── Cart ───────────────────────────────────────── */

  var CART_CREATE = [
    'mutation cartCreate($input: CartInput!) {',
    '  cartCreate(input: $input) {',
    '    cart { id checkoutUrl totalQuantity cost { totalAmount { amount currencyCode } } }',
    '    userErrors { field message }',
    '  }',
    '}'
  ].join('\n');

  var CART_LINES_ADD = [
    'mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {',
    '  cartLinesAdd(cartId: $cartId, lines: $lines) {',
    '    cart { id checkoutUrl totalQuantity cost { totalAmount { amount currencyCode } }',
    '      lines(first: 50) { edges { node { id quantity merchandise { ... on ProductVariant {',
    '        id title price { amount currencyCode } image { url }',
    '        product { title featuredImage { url } }',
    '        selectedOptions { name value }',
    '      } } } } } }',
    '    userErrors { field message }',
    '  }',
    '}'
  ].join('\n');

  var CART_LINES_UPDATE = [
    'mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {',
    '  cartLinesUpdate(cartId: $cartId, lines: $lines) {',
    '    cart { id checkoutUrl totalQuantity cost { totalAmount { amount currencyCode } }',
    '      lines(first: 50) { edges { node { id quantity merchandise { ... on ProductVariant {',
    '        id title price { amount currencyCode } image { url }',
    '        product { title featuredImage { url } }',
    '        selectedOptions { name value }',
    '      } } } } } }',
    '    userErrors { field message }',
    '  }',
    '}'
  ].join('\n');

  var CART_LINES_REMOVE = [
    'mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {',
    '  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {',
    '    cart { id checkoutUrl totalQuantity cost { totalAmount { amount currencyCode } }',
    '      lines(first: 50) { edges { node { id quantity merchandise { ... on ProductVariant {',
    '        id title price { amount currencyCode } image { url }',
    '        product { title featuredImage { url } }',
    '        selectedOptions { name value }',
    '      } } } } } }',
    '    userErrors { field message }',
    '  }',
    '}'
  ].join('\n');

  var CART_QUERY = [
    'query cart($cartId: ID!) {',
    '  cart(id: $cartId) {',
    '    id checkoutUrl totalQuantity',
    '    cost { totalAmount { amount currencyCode } }',
    '    lines(first: 50) { edges { node { id quantity merchandise { ... on ProductVariant {',
    '      id title price { amount currencyCode } image { url }',
    '      product { title featuredImage { url } }',
    '      selectedOptions { name value }',
    '    } } } } } }',
    '  }',
    '}'
  ].join('\n');

  function parseCart(data) {
    var cart = data.cart || (data.cartCreate && data.cartCreate.cart) ||
               (data.cartLinesAdd && data.cartLinesAdd.cart) ||
               (data.cartLinesUpdate && data.cartLinesUpdate.cart) ||
               (data.cartLinesRemove && data.cartLinesRemove.cart);
    if (!cart) return null;

    var lines = (cart.lines && cart.lines.edges || []).map(function (edge) {
      var node = edge.node;
      var merch = node.merchandise || {};
      var product = merch.product || {};
      var opts = (merch.selectedOptions || []).map(function (o) {
        return o.value;
      }).join(' / ');

      return {
        lineId: node.id,
        quantity: node.quantity,
        variantId: merch.id,
        title: product.title || merch.title || 'Item',
        variantTitle: opts || (merch.title !== product.title ? merch.title : ''),
        price: merch.price ? parseFloat(merch.price.amount) : 0,
        currency: merch.price ? merch.price.currencyCode : cfg.currency,
        image: (merch.image && merch.image.url) || (product.featuredImage && product.featuredImage.url) || null
      };
    });

    return {
      id: cart.id,
      checkoutUrl: cart.checkoutUrl,
      totalQuantity: cart.totalQuantity,
      total: cart.cost && cart.cost.totalAmount ? parseFloat(cart.cost.totalAmount.amount) : 0,
      currency: cart.cost && cart.cost.totalAmount ? cart.cost.totalAmount.currencyCode : cfg.currency,
      lines: lines
    };
  }

  window.ZCShopify = {
    isReady: isReady,
    fetchProducts: fetchProducts,
    findVariant: findVariant,
    getOptionValues: getOptionValues,
    formatMoney: formatMoney,

    createCart: function () {
      return gql(CART_CREATE, { input: {} }).then(function (data) {
        return parseCart(data);
      });
    },

    getCart: function (cartId) {
      return gql(CART_QUERY, { cartId: cartId }).then(function (data) {
        return parseCart(data);
      });
    },

    addToCart: function (cartId, variantId, quantity) {
      return gql(CART_LINES_ADD, {
        cartId: cartId,
        lines: [{ merchandiseId: variantId, quantity: quantity || 1 }]
      }).then(function (data) {
        var errors = data.cartLinesAdd && data.cartLinesAdd.userErrors;
        if (errors && errors.length) throw new Error(errors[0].message);
        return parseCart(data);
      });
    },

    updateLine: function (cartId, lineId, quantity) {
      return gql(CART_LINES_UPDATE, {
        cartId: cartId,
        lines: [{ id: lineId, quantity: quantity }]
      }).then(function (data) {
        return parseCart(data);
      });
    },

    removeLine: function (cartId, lineIds) {
      return gql(CART_LINES_REMOVE, {
        cartId: cartId,
        lineIds: lineIds
      }).then(function (data) {
        return parseCart(data);
      });
    }
  };

})();
