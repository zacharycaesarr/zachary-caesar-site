/* ================================================================
   PRODUCTS DATA — ZACHARY CAESAR SHOP
   ================================================================

   HOW TO ADD A PRODUCT (copy this template):
   ──────────────────────────────────────────
   {
     id:           "unique-id",           // no spaces, lowercase
     name:         "PRODUCT NAME",
     price:        "$35",                // display price
     priceAmount:  35.00,                // number for cart math
     ribbon:       "HOT",                // "HOT" | "NEW" | "LIMITED" | ""
     image:        null,                 // regular photo (optional)
     mockupImage:  null,                 // transparent PNG mockup (recommended)
     variantId:    "",                   // Shopify variant GID (see below)
     sizes:        ["S","M","L","XL"],   // shown in quick view
     variants:     {},                   // optional: { "M": "gid://shopify/ProductVariant/123" }
     description:  ""
   },

   PRODUCT IMAGES (transparent PNG mockups):
   ───────────────────────────────────────
   1. Export your Tapstitch mockup as PNG with transparent background
   2. Save to: assets/img/products/your-product.png
   3. Set mockupImage: "assets/img/products/your-product.png"
   The site adds a themed gradient background + drop shadow automatically.

   SHOPIFY VARIANT ID:
   ───────────────────
   In Shopify Admin → Products → click product → click a variant
   The URL contains the variant number. For the API, use the full GID:
     "gid://shopify/ProductVariant/12345678901234"
   Paste that into variantId (or variants object for size-specific IDs).

   SHOP CONFIG: data/shop-config.js (fill in once, then set enabled: true)
   ================================================================ */

window.ZC_PRODUCTS = [

  {
    id:          "ll-bundle",
    name:        "LIGHT LEAKS BUNDLE",
    price:       "$XX",
    ribbon:      "LIMITED",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-keychain",
    name:        "LIGHT LEAKS KEYCHAIN",
    price:       "$XX",
    ribbon:      "",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-totebag",
    name:        "LIGHT LEAKS TOTE BAG",
    price:       "$XX",
    ribbon:      "",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-socks",
    name:        "LIGHT LEAKS SOCKS",
    price:       "$XX",
    ribbon:      "NEW",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-poster",
    name:        "LIGHT LEAKS POSTER",
    price:       "$XX",
    ribbon:      "",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-phonecase",
    name:        "LIGHT LEAKS PHONE CASE",
    price:       "$XX",
    ribbon:      "HOT",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-jacket",
    name:        "LIGHT LEAKS JACKET",
    price:       "$XX",
    ribbon:      "",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-beanie",
    name:        "LIGHT LEAKS BEANIE",
    price:       "$XX",
    ribbon:      "NEW",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-hat",
    name:        "LIGHT LEAKS HAT",
    price:       "$XX",
    ribbon:      "",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-sweatpants",
    name:        "LIGHT LEAKS SWEATPANTS",
    price:       "$XX",
    ribbon:      "HOT",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-shorts",
    name:        "LIGHT LEAKS SHORTS",
    price:       "$XX",
    ribbon:      "",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-longsleeve",
    name:        "LIGHT LEAKS LONG SLEEVE",
    price:       "$XX",
    ribbon:      "NEW",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-crewneck",
    name:        "LIGHT LEAKS CREWNECK",
    price:       "$XX",
    ribbon:      "",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-product-4",
    name:        "PRODUCT NAME",
    price:       "$XX",
    ribbon:      "NEW",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-hoodie",
    name:        "LIGHT LEAKS HOODIE",
    price:       "$XX",
    ribbon:      "",
    image:       null,
    shopifyUrl:  "#"
  },
  {
    id:          "ll-tee",
    name:        "LIGHT LEAKS TEE",
    price:       "$XX",
    priceAmount: 0,
    ribbon:      "HOT",
    image:       null,
    mockupImage: null,
    variantId:   "",
    sizes:       ["S", "M", "L", "XL", "XXL"],
    variants:    {},
    description: ""
  }

];
