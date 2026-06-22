/* ================================================================
   PRODUCT OVERRIDES (optional)
   ================================================================

   Products load automatically from Shopify. You never need to
   enter variant IDs, colors, or sizes here.

   ── TRANSPARENT PRODUCT IMAGES (recommended) ──
   For the cleanest look without white boxes:

   1. Export mockup from Tapstitch as PNG with transparent background
   2. Save to: assets/img/products/your-file.png
   3. Add an entry below using the product's Shopify handle:

   "your-product-handle": {
     ribbon: "HOT",
     displayName: "SHORTER NAME",
     mockupImage: "assets/img/products/your-file.png"
   }

   mockupImage replaces Shopify photos on the grid card.
   The modal still shows all Shopify angles + variant photos.

   ── WITHOUT custom PNGs ──
   Shopify photos auto-use mix-blend-mode to reduce white backgrounds
   on the cream site. Custom transparent PNGs always look best.

   Find the handle: Shopify → Product → Search engine listing → URL handle
   ================================================================ */

window.ZC_PRODUCT_OVERRIDES = {

  /* Example (uncomment and edit when you have a transparent PNG):
  "love-2-feed-fear-cotton-t-shirt-v2": {
    ribbon: "HOT",
    displayName: "LOVE 2 FEED FEAR TEE",
    mockupImage: "assets/img/products/love-2-feed-fear.png"
  }
  */

};
