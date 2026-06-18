(function () {
  var container = document.getElementById('zc-eye-container');
  if (!container) return;

  var pupil     = document.getElementById('zc-pupil');
  var iris      = document.getElementById('zc-iris');
  var irisDetail = document.getElementById('zc-iris-detail');
  var highlight = document.getElementById('zc-highlight');

  if (!pupil || !iris) return;

  var CX = 250;
  var CY = 125;
  var MAX_TRAVEL = 52;

  var curX = CX, curY = CY;
  var tgtX = CX, tgtY = CY;

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Apply positions — iris and pupil are SYNCED (move as one unit) */
  function applyPosition(x, y) {
    pupil.setAttribute('cx', x);
    pupil.setAttribute('cy', y);

    /* Iris stays centered on pupil — no lerp offset */
    iris.setAttribute('cx', x);
    iris.setAttribute('cy', y);

    /* Detail ring tracks iris */
    if (irisDetail) {
      irisDetail.setAttribute('cx', x);
      irisDetail.setAttribute('cy', y);
    }

    /* Highlight: fixed offset from pupil, rotation center updated to its own position */
    if (highlight) {
      var hx = x + 16, hy = y - 13;
      highlight.setAttribute('cx', hx);
      highlight.setAttribute('cy', hy);
      highlight.setAttribute('transform', 'rotate(-20 ' + hx + ' ' + hy + ')');
    }
  }

  /* ── Desktop: cursor tracking ──────────────────── */
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

  /* ── Mobile: random wander ─────────────────────── */
  if (isTouch) {
    var scheduleWander = function () {
      var angle  = Math.random() * Math.PI * 2;
      var travel = MAX_TRAVEL * (0.5 + Math.random() * 0.5);
      tgtX = CX + Math.cos(angle) * travel;
      tgtY = CY + Math.sin(angle) * travel;
      setTimeout(scheduleWander, 700 + Math.random() * 1200);
    };
    scheduleWander();
  }

  /* ── Animation loop ────────────────────────────── */
  var easing = isTouch ? 0.062 : 0.075;

  function tick() {
    curX = lerp(curX, tgtX, easing);
    curY = lerp(curY, tgtY, easing);
    applyPosition(curX, curY);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ── Blink ─────────────────────────────────────── */
  var eyeInner = document.getElementById('zc-eye-inner');
  if (eyeInner) {
    var doBlink = function () {
      eyeInner.style.transition    = 'transform 65ms ease-in';
      eyeInner.style.transform     = 'scaleY(0.04)';
      eyeInner.style.transformOrigin = CX + 'px ' + CY + 'px';

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

  /* ── Scroll parallax on the eye container ──────── */
  window.addEventListener('scroll', function () {
    var s = window.scrollY;
    container.style.transform = 'translate(-50%, calc(-50% + ' + (s * 0.18) + 'px))';
  }, { passive: true });

})();
