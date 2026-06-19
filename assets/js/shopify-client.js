/* ================================================================
   shopify-client.js
   Talks to Shopify Storefront API for cart + checkout.
   Only active when data/shop-config.js has enabled: true.
   ================================================================ */

(function () {
  'use strict';

  var cfg = window.ZC_SHOP_CONFIG || {};
  var API_VERSION = '2024-10';

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

  /* ── Cart mutations ─────────────────────────────── */

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
    '        id title price { amount currencyCode } product { title featuredImage { url } }',
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
    '        id title price { amount currencyCode } product { title featuredImage { url } }',
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
    '        id title price { amount currencyCode } product { title featuredImage { url } }',
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
    '      id title price { amount currencyCode } product { title featuredImage { url } }',
    '    } } } } } }',
    '  }',
    '}'
  ].join('\n');

  function parseCart(data) {
    var cart = data.cart || data.cartCreate && data.cartCreate.cart ||
               data.cartLinesAdd && data.cartLinesAdd.cart ||
               data.cartLinesUpdate && data.cartLinesUpdate.cart ||
               data.cartLinesRemove && data.cartLinesRemove.cart;
    if (!cart) return null;

    var lines = (cart.lines && cart.lines.edges || []).map(function (edge) {
      var node = edge.node;
      var merch = node.merchandise || {};
      var product = merch.product || {};
      return {
        lineId: node.id,
        quantity: node.quantity,
        variantId: merch.id,
        title: product.title || merch.title || 'Item',
        variantTitle: merch.title !== product.title ? merch.title : '',
        price: merch.price ? parseFloat(merch.price.amount) : 0,
        currency: merch.price ? merch.price.currencyCode : cfg.currency,
        image: product.featuredImage ? product.featuredImage.url : null
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
