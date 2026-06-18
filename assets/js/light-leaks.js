/* ============================================================
   light-leaks.js
   Cinematic intro sequence + interactive eye + flashlight mode
   Only loaded on light-leaks.html
   ============================================================ */

(function () {
  'use strict';

  /* ── Element refs ─────────────────────────────── */
  var intro       = document.getElementById('ll-intro');
  var scene       = document.getElementById('ll-scene');
  var eyeWrap     = document.getElementById('ll-eye-wrap');
  var eyeSvg      = document.getElementById('ll-eye-svg');
  var taglineEl   = document.getElementById('ll-tagline');
  var navEl       = document.getElementById('ll-nav');
  var btnShop     = document.getElementById('ll-btn-shop');
  var btnMusic    = document.getElementById('ll-btn-music');
  var btnExamine  = document.getElementById('ll-btn-examine');
  var flashlight  = document.getElementById('ll-flashlight');
  var llDark      = document.getElementById('ll-dark');
  var llClose     = document.getElementById('ll-close');
  var irisEl      = document.getElementById('ll-iris');
  var pupilEl     = document.getElementById('ll-pupil');
  var highlightEl = document.getElementById('ll-highlight');
  var irisRingEl  = document.getElementById('ll-iris-ring');
  var words       = taglineEl ? taglineEl.querySelectorAll('.ll-word') : [];

  if (!intro || !scene || !eyeWrap) return;

  /* ── Device detection ──────────────────────────── */
  var isTouch = ('ontouchstart' in window) || window.matchMedia('(hover:none)').matches;

  /* ── SVG coordinate space ──────────────────────── */
  var CX = 250, CY = 125;
  var MAX_TRAVEL = 50;

  var curX = CX, curY = CY;
  var tgtX = CX, tgtY = CY;
  var trackingMode = 'none'; // 'none' | 'sequence' | 'cursor'

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── Apply all eye element positions ──────────────
     Iris and pupil are SYNCED — they move as one unit.
     The highlight offset updates its rotation center too.
  ─────────────────────────────────────────────────── */
  function applyEyePos(x, y) {
    if (!pupilEl || !irisEl) return;

    pupilEl.setAttribute('cx', x);
    pupilEl.setAttribute('cy', y);

    /* Iris stays centered on the pupil (synced, no offset) */
    irisEl.setAttribute('cx', x);
    irisEl.setAttribute('cy', y);

    /* Detail ring tracks iris */
    if (irisRingEl) {
      irisRingEl.setAttribute('cx', x);
      irisRingEl.setAttribute('cy', y);
    }

    /* Highlight: fixed offset from pupil center + keep rotation on itself */
    if (highlightEl) {
      var hx = x + 14, hy = y - 11;
      highlightEl.setAttribute('cx', hx);
      highlightEl.setAttribute('cy', hy);
      highlightEl.setAttribute('transform', 'rotate(-18 ' + hx + ' ' + hy + ')');
    }
  }

  /* ── Smooth animation loop ─────────────────────── */
  var LERP_SPEED = 0.058;

  (function eyeLoop() {
    curX = lerp(curX, tgtX, LERP_SPEED);
    curY = lerp(curY, tgtY, LERP_SPEED);
    applyEyePos(curX, curY);
    requestAnimationFrame(eyeLoop);
  })();

  /* ── Move eye from a screen coordinate ──────────── */
  function updateEyeFromScreen(screenX, screenY) {
    if (!eyeWrap) return;
    var rect  = eyeWrap.getBoundingClientRect();
    var ecx   = rect.left + rect.width  / 2;
    var ecy   = rect.top  + rect.height / 2;
    var dx    = screenX - ecx;
    var dy    = screenY - ecy;
    var dist  = Math.sqrt(dx * dx + dy * dy);
    var angle = Math.atan2(dy, dx);
    var travel = Math.min(dist / 5.2, MAX_TRAVEL);
    tgtX = CX + Math.cos(angle) * travel;
    tgtY = CY + Math.sin(angle) * travel;
  }

  /* ── Named gaze directions (intro sequence) ──────── */
  var DIRS = {
    forward:       [CX,       CY      ],
    'down-left':   [CX - 30,  CY + 26 ],
    'down-center': [CX,       CY + 34 ],
    'down-right':  [CX + 30,  CY + 26 ]
  };

  function eyeLookDirection(dir) {
    var pos = DIRS[dir] || DIRS.forward;
    tgtX = pos[0];
    tgtY = pos[1];
  }

  /* ── Iris widen animation ──────────────────────── */
  function triggerIrisWiden(callback) {
    if (!irisEl) { if (callback) callback(); return; }
    irisEl.classList.add('widen');
    irisEl.addEventListener('animationend', function handler() {
      irisEl.classList.remove('widen');
      irisEl.removeEventListener('animationend', handler);
      if (callback) callback();
    });
  }

  /* ── Cursor tracking (post-sequence) ──────────── */
  function startCursorTracking() {
    trackingMode = 'cursor';
    LERP_SPEED   = 0.072;

    if (!isTouch) {
      document.addEventListener('mousemove', function (e) {
        if (trackingMode !== 'cursor' || flActive) return;
        updateEyeFromScreen(e.clientX, e.clientY);
      }, { passive: true });
    } else {
      var wander = function () {
        if (trackingMode !== 'cursor') return;
        var angle  = Math.random() * Math.PI * 2;
        var travel = MAX_TRAVEL * (0.5 + Math.random() * 0.5);
        tgtX = CX + Math.cos(angle) * travel;
        tgtY = CY + Math.sin(angle) * travel;
        setTimeout(wander, 650 + Math.random() * 1100);
      };
      wander();
    }
  }

  /* ── Blink ─────────────────────────────────────── */
  function scheduleBlink() {
    setTimeout(function () {
      if (!eyeSvg) return;
      eyeSvg.style.transition      = 'transform 65ms ease-in';
      eyeSvg.style.transform       = 'scaleY(0.04)';
      eyeSvg.style.transformOrigin = '50% 50%';
      setTimeout(function () {
        eyeSvg.style.transition = 'transform 110ms ease-out';
        eyeSvg.style.transform  = 'scaleY(1)';
        scheduleBlink();
      }, 65);
    }, 2600 + Math.random() * 4200);
  }

  /* ════════════════════════════════════════════════
     PHASE 1 — INTRO SEQUENCE
  ════════════════════════════════════════════════ */

  /* Fade intro in on load (smooth appearance) */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      intro.classList.add('visible');
    });
  });

  /* Sequence timing (ms) */
  var T = {
    hold:        2500,
    eyeReveal:    120,
    wordStart:    950,
    wordStagger:  220,
    btnStart:    1750,
    btnStagger:   840,
    irisDelay:    700,
  };

  setTimeout(function startSequence() {

    /* Step 1: fade out intro */
    intro.classList.remove('visible');
    intro.classList.add('fade-out');

    /* Step 2: reveal scene */
    scene.setAttribute('aria-hidden', 'false');
    scene.classList.add('visible');

    /* Step 3: eye scales + fades in */
    setTimeout(function () { eyeWrap.classList.add('visible'); }, T.eyeReveal);

    /* Step 4: words blur in one by one */
    words.forEach(function (word, i) {
      setTimeout(function () { word.classList.add('visible'); },
        T.wordStart + i * T.wordStagger);
    });

    /* Step 5 & 6: buttons appear left→right, eye gazes at each */
    var gazeMap  = ['down-left', 'down-center', 'down-right'];
    var btnOrder = [btnShop, btnMusic, btnExamine];
    trackingMode = 'sequence';

    btnOrder.forEach(function (btn, i) {
      setTimeout(function () {
        if (btn) btn.classList.add('visible');
        eyeLookDirection(gazeMap[i]);
      }, T.btnStart + i * T.btnStagger);
    });

    /* Step 7: iris widen after last button */
    var lastBtnDelay = T.btnStart + (btnOrder.length - 1) * T.btnStagger;

    setTimeout(function () {
      if (btnExamine) btnExamine.classList.add('gazing');

      triggerIrisWiden(function () {
        eyeLookDirection('forward');
        if (btnExamine) btnExamine.classList.remove('gazing');
        setTimeout(function () {
          startCursorTracking();
          scheduleBlink();
        }, 500);
      });
    }, lastBtnDelay + T.irisDelay);

    /* Remove intro from DOM after it's invisible */
    setTimeout(function () { intro.style.display = 'none'; }, 1100);

  }, T.hold);

  /* ════════════════════════════════════════════════
     PHASE 2 — FLASHLIGHT / EXAMINE SOURCE
  ════════════════════════════════════════════════ */

  var FL_RADIUS = isTouch ? 138 : 112;
  var flActive  = false;

  /* RAF-throttled mask update */
  var pendingFX = null, pendingFY = null, flRaf = false;

  function applyFlashlight(x, y) {
    if (!llDark) return;
    var r = FL_RADIUS;
    var g = 'radial-gradient(circle ' + r + 'px at ' + x + 'px ' + y + 'px,' +
            'transparent 0%,transparent 50%,' +
            'rgba(0,0,0,0.88) 72%,#0A0806 93%)';
    llDark.style.webkitMaskImage = g;
    llDark.style.maskImage       = g;
  }

  function queueFlashlight(x, y) {
    pendingFX = x; pendingFY = y;
    if (!flRaf) {
      flRaf = true;
      requestAnimationFrame(function () {
        if (pendingFX !== null) applyFlashlight(pendingFX, pendingFY);
        flRaf = false;
      });
    }
  }

  /* Move BOTH flashlight beam AND eye from the same screen position */
  function pointerToFlashlight(x, y) {
    queueFlashlight(x, y);
    updateEyeFromScreen(x, y); /* eye follows the flashlight */
  }

  function enterFlashlight() {
    if (!flashlight || flActive) return;
    flActive = true;

    /* Fade tagline + nav */
    [taglineEl, navEl].forEach(function (el) {
      if (!el) return;
      el.style.transition = 'opacity 450ms ease';
      el.style.opacity    = '0';
    });

    /* Start beam centered on eye */
    var rect   = eyeWrap ? eyeWrap.getBoundingClientRect() : null;
    var startX = rect ? rect.left + rect.width  / 2 : window.innerWidth  / 2;
    var startY = rect ? rect.top  + rect.height / 2 : window.innerHeight / 2;
    applyFlashlight(startX, startY);

    setTimeout(function () {
      flashlight.setAttribute('aria-hidden', 'false');
      flashlight.classList.add('active');
    }, 280);
  }

  function exitFlashlight() {
    if (!flActive) return;
    flActive = false;
    flashlight.classList.remove('active');
    flashlight.setAttribute('aria-hidden', 'true');

    setTimeout(function () {
      [taglineEl, navEl].forEach(function (el) {
        if (!el) return;
        el.style.transition = 'opacity 500ms ease';
        el.style.opacity    = '1';
      });
    }, 350);
  }

  /* ── Input listeners ───────────────────────────── */

  if (btnExamine) {
    btnExamine.addEventListener('click', enterFlashlight);
    /* touchend fires after touchstart so we can preventDefault
       to avoid double-firing on some mobile browsers */
    btnExamine.addEventListener('touchend', function (e) {
      e.preventDefault();
      enterFlashlight();
    });
  }

  if (llClose) {
    llClose.addEventListener('click', exitFlashlight);
    llClose.addEventListener('touchend', function (e) {
      e.preventDefault();
      exitFlashlight();
    });
  }

  /* Desktop mouse: flashlight beam + eye (in flashlight mode)
     OR cursor tracking (in normal mode — handled by startCursorTracking) */
  document.addEventListener('mousemove', function (e) {
    if (!flActive) return;
    pointerToFlashlight(e.clientX, e.clientY);
  }, { passive: true });

  /* Mobile touch START — immediately position beam + eye */
  document.addEventListener('touchstart', function (e) {
    if (!flActive) return;
    var t = e.touches[0];
    pointerToFlashlight(t.clientX, t.clientY);
  }, { passive: true });

  /* Mobile touch MOVE — drag beam + eye together */
  document.addEventListener('touchmove', function (e) {
    if (!flActive) return;
    var t = e.touches[0];
    pointerToFlashlight(t.clientX, t.clientY);
  }, { passive: true });

  /* Escape key exits */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && flActive) exitFlashlight();
  });

  /* Recalculate radius on orientation change */
  window.addEventListener('resize', function () {
    FL_RADIUS = window.matchMedia('(hover:none)').matches ? 138 : 112;
  }, { passive: true });

})();
