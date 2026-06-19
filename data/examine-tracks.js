/* ================================================================
   EXAMINE SOURCE — Hidden track text (Light Leaks page)
   ================================================================

   HOW TO EDIT:
   1. Open this file on GitHub (data/examine-tracks.js) → pencil icon
   2. Change titles, positions, or add/remove items
   3. Save — live in ~30 seconds

   TRACKS (type: "track"):
   - Appear in the flashlight beam
   - Will become tappable links to music.html / streaming URLs
   - Set "musicUrl" when ready (e.g. "music.html#light-leaks")

   QUOTES (type: "quote"):
   - Decorative text only — not clickable

   POSITION: use top/left as % (e.g. "18%") and rot for rotation in degrees
   ================================================================ */

window.ZC_EXAMINE_ITEMS = [

  /* ── Tracks (will link to music page later) ── */
  { type: "track", id: "light-leaks",    title: "LIGHT LEAKS",       top: "18%", left: "12%", rot: -4,  musicUrl: "#" },
  { type: "track", id: "good-november",  title: "GOOD NOVEMBER",     top: "34%", left: "58%", rot: 3,   musicUrl: "#" },
  { type: "track", id: "if-not-now",     title: "IF NOT NOW",        top: "54%", left: "24%", rot: -2,  musicUrl: "#" },
  { type: "track", id: "calliope",       title: "CALLIOPE",          top: "70%", left: "62%", rot: 5,   musicUrl: "#" },
  { type: "track", id: "bftd",           title: "BFTD",              top: "46%", left: "72%", rot: -3,  musicUrl: "#" },
  { type: "track", id: "sincerely-yours",title: "SINCERELY YOURS",   top: "28%", left: "32%", rot: 2,   musicUrl: "#" },
  { type: "track", id: "info",           title: "INFO",              top: "64%", left: "8%",  rot: -5,  musicUrl: "#" },
  { type: "track", id: "resemblance",    title: "RESEMBLANCE",       top: "76%", left: "44%", rot: 1,   musicUrl: "#" },

  /* ── Quotes / decorative (not clickable) ── */
  { type: "quote", title: "— LL —",                  top: "11%", left: "50%", rot: 0,  size: "large" },
  { type: "quote", title: "WATCH THE LIGHT BLEED",   top: "80%", left: "16%", rot: -1, spacing: "0.3em" },
  { type: "quote", title: "ZACHARY CAESAR",          top: "42%", left: "4%",  rot: 90, vertical: true },
  { type: "quote", title: "2026",                    top: "22%", left: "80%", rot: -3 },
  { type: "quote", title: "light leaks.",            top: "62%", left: "40%", rot: 2,  small: true },
  { type: "quote", title: "CROOKED SMILE",           top: "88%", left: "50%", rot: 0,  spacing: "0.4em" }

];
