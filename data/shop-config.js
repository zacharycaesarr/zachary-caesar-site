/* ================================================================
   SHOP CONFIG — Zachary Caesar
   ================================================================

   Fill this in ONCE when your Shopify store is ready.
   You can edit this file directly on GitHub (pencil icon).

   WHAT YOU NEED FROM SHOPIFY:
   ───────────────────────────
   1. Store domain
      → Settings → Domains → your-store.myshopify.com
      Example: "zachary-caesar.myshopify.com"

   2. Storefront API access token (public — safe to use on your site)
      → Settings → Apps and sales channels → Develop apps
      → Create an app → Configure Storefront API scopes:
         unauthenticated_read_product_listings
         unauthenticated_read_product_inventory
         unauthenticated_read_checkouts
         unauthenticated_write_checkouts
         unauthenticated_read_customers (optional)
      → Install app → copy "Storefront API access token"

   3. Products created in Shopify (synced with Tapstitch)
      → Each product needs a Variant ID copied into data/products.js

   WHAT YOU NEED FROM TAPSTITCH:
   ───────────────────────────
   - Design your merch in Tapstitch
   - Connect Tapstitch → Shopify (they have an integration)
   - Products auto-sync to Shopify; you grab variant IDs from Shopify admin

   HOW CHECKOUT WORKS:
   ───────────────────
   - Cart lives ON YOUR SITE (animated drawer, add/remove items)
   - When customer clicks CHECKOUT → goes to Shopify's secure payment page
   - This is NOT your Shopify storefront theme — it's a checkout-only URL
   - After payment, Tapstitch fulfills the order automatically

   Set "enabled" to true once storeDomain + storefrontAccessToken are filled in.
   Until then, the shop runs in DEMO MODE (cart works locally for testing UI).
   ================================================================ */

window.ZC_SHOP_CONFIG = {

  /* Flip to true when Shopify credentials below are filled in */
  enabled: false,

  /* Your .myshopify.com domain (no https://) */
  storeDomain: "",

  /* Storefront API access token from your custom Shopify app */
  storefrontAccessToken: "",

  currency: "USD",
  currencySymbol: "$",

  /* Optional: custom checkout branding appears on Shopify checkout page */
  checkoutBrandName: "Zachary Caesar"

};
