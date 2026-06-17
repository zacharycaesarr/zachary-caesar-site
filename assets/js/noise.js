/* ============================================================
   noise.js — animated film-grain overlay via canvas
   Works in all browsers, no SVG security restrictions.
   ============================================================ */
(function () {
  var TILE  = 256;   // noise tile size in px
  var FPS   = 18;    // grain animation speed
  var OPAC  = 0.072; // overall opacity (increase for more texture)
  var TILES = 8;     // number of unique tiles to cycle through

  /* Generate a single grayscale noise tile */
  function makeTile() {
    var c   = document.createElement('canvas');
    c.width = c.height = TILE;
    var ctx = c.getContext('2d');
    var img = ctx.createImageData(TILE, TILE);
    var d   = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL('image/png');
  }

  /* Pre-generate all tiles */
  var tiles = [];
  for (var t = 0; t < TILES; t++) tiles.push(makeTile());

  /* Create the overlay element */
  var el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = [
    'position:fixed',
    'inset:0',
    'width:100%',
    'height:100%',
    'pointer-events:none',
    'z-index:9997',
    'opacity:' + OPAC,
    'mix-blend-mode:multiply',
    'background-repeat:repeat',
    'background-size:' + TILE + 'px ' + TILE + 'px',
    'will-change:background-image'
  ].join(';');

  document.body.appendChild(el);

  /* Cycle tiles */
  var frame    = 0;
  var lastTick = 0;
  var interval = 1000 / FPS;

  function tick(ts) {
    if (ts - lastTick >= interval) {
      frame = (frame + 1) % TILES;
      el.style.backgroundImage = 'url(' + tiles[frame] + ')';
      lastTick = ts;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
