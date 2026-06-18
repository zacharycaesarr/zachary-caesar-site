(function () {
  var container = document.getElementById('zc-eye-container');
  if (!container) return;

  var pupil    = document.getElementById('zc-pupil');
  var iris     = document.getElementById('zc-iris');
  var hiMain   = document.getElementById('zc-hl-main');
  var hiSmall  = document.getElementById('zc-hl-small');
  var eyeInner = document.getElementById('zc-eye-inner');

  if (!pupil || !iris) return;

  // SVG coordinate-space eye center
  var CX = 250;
  var CY = 125;
  var MAX_TRAVEL = 52; // max pupil offset in SVG units

  var curX = CX, curY = CY;
  var tgtX = CX, tgtY = CY;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function applyPosition(x, y) {
    pupil.setAttribute('cx', x);
    pupil.setAttribute('cy', y);

    // Iris follows pupil but with less travel (looks natural)
    var ix = lerp(CX, x, 0.52);
    var iy = lerp(CY, y, 0.52);
    iris.setAttribute('cx', ix);
    iris.setAttribute('cy', iy);

    // Highlights track pupil
    if (hiMain)  { hiMain.setAttribute('cx',  x + 16); hiMain.setAttribute('cy',  y - 13); }
    if (hiSmall) { hiSmall.setAttribute('cx', x -  9); hiSmall.setAttribute('cy', y + 11); }
  }

  // ── Desktop: cursor tracking ────────────────────
  var isTouch = ('ontouchstart' in window) || window.matchMedia('(hover: none)').matches;

  if (!isTouch) {
    document.addEventListener('mousemove', function (e) {
      var rect  = container.getBoundingClientRect();
      var cx    = rect.left + rect.width  / 2;
      var cy    = rect.top  + rect.height / 2;
      var dx    = e.clientX - cx;
      var dy    = e.clientY - cy;
      var dist  = Math.sqrt(dx * dx + dy * dy);
      var angle = Math.atan2(dy, dx);
      var travel = Math.min(dist / 5.5, MAX_TRAVEL);
      tgtX = CX + Math.cos(angle) * travel;
      tgtY = CY + Math.sin(angle) * travel;
    }, { passive: true });
  }

  // ── Mobile: random wander ───────────────────────
  if (isTouch) {
    var scheduleWander = function () {
      var angle  = Math.random() * Math.PI * 2;
      // Full MAX_TRAVEL range so movement is clearly visible
      var travel = MAX_TRAVEL * (0.5 + Math.random() * 0.5);
      tgtX = CX + Math.cos(angle) * travel;
      tgtY = CY + Math.sin(angle) * travel;
      // Shorter intervals so movement feels alive
      setTimeout(scheduleWander, 700 + Math.random() * 1200);
    };
    scheduleWander();
  }

  // ── Animation loop ──────────────────────────────
  // Higher easing on mobile = snappier, more noticeable movement
  var easing = isTouch ? 0.062 : 0.075;

  function tick() {
    curX = lerp(curX, tgtX, easing);
    curY = lerp(curY, tgtY, easing);
    applyPosition(curX, curY);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ── Blink ───────────────────────────────────────
  if (eyeInner) {
    eyeInner.style.transformOrigin = CX + 'px ' + CY + 'px';

    var doBlink = function () {
      eyeInner.style.transition = 'transform 65ms ease-in';
      eyeInner.style.transform  = 'scaleY(0.04)';

      setTimeout(function () {
        eyeInner.style.transition = 'transform 110ms ease-out';
        eyeInner.style.transform  = 'scaleY(1)';
        setTimeout(scheduleBlink, 250);
      }, 65);
    };

    var scheduleBlink = function () {
      setTimeout(doBlink, 2800 + Math.random() * 4500);
    };
    scheduleBlink();
  }

  // ── Subtle scroll parallax on the eye ──────────
  var lastScroll = 0;
  window.addEventListener('scroll', function () {
    var s = window.scrollY;
    container.style.transform = 'translate(-50%, calc(-50% + ' + (s * 0.18) + 'px))';
    lastScroll = s;
  }, { passive: true });

})();
