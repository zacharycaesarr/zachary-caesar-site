/* ================================================================
   SHOP CONFIG — Zachary Caesar
   ================================================================

   HOW TO ADD NEW MERCH (no coding):
   ─────────────────────────────────
   1. Design in Tapstitch → syncs to Shopify automatically
   2. In Shopify Admin → Products → open product → scroll to SALES CHANNELS
   3. Make sure "Headless" (or your custom storefront app) is checked ✓
   4. Add product to your collection (see collectionHandle below)
   5. Done — it appears on your site within seconds of refresh

   OPTIONAL styling tweaks → data/product-overrides.js (ribbons, custom PNGs)

   PARTNER / DEV STORES:
   ─────────────────────
   Shopify Partner development stores work the same way. Just publish
   products to the Headless / Storefront API sales channel.

   ================================================================ */

window.ZC_SHOP_CONFIG = {

  enabled: true,

  storeDomain: "zachary-caesar.myshopify.com",

  storefrontAccessToken: "4f93e5a8affb26d8e86507d34a84e522",

  currency: "USD",
  currencySymbol: "$",

  checkoutBrandName: "ZACHARY CAESAR.",

  /*
   * Collection handle — products in this Shopify collection show on your site.
   * Create: Shopify Admin → Products → Collections → Create collection
   * Add your Tapstitch products to it, then paste the handle here.
   * The handle is the URL slug, e.g. "light-leaks-drop" for /collections/light-leaks-drop
   *
   * Leave empty ("") to show ALL published products instead.
   */
  collectionHandle: ""

};
