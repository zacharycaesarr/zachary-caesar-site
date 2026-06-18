/* ============================================================
   light-leaks.js
   Cinematic intro sequence + interactive eye + flashlight mode
   Only loaded on light-leaks.html
   ============================================================ */

(function () {
  'use strict';

  /* ── Element refs ────────────────────────────────── */
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
  var words       = taglineEl ? taglineEl.querySelectorAll('.ll-word') : [];

  if (!intro || !scene || !eyeWrap) return;

  /* ── Device detection ───────────────────────────── */
  var isTouch = ('ontouchstart' in window) || window.matchMedia('(hover:none)').matches;

  /* ── SVG eye coordinate space ───────────────────── */
  var CX = 250, CY = 125;   // SVG center
  var MAX_TRAVEL = 50;       // max pupil offset in SVG units

  /* Current and target pupil positions (lerped each frame) */
  var curX = CX, curY = CY;
  var tgtX = CX, tgtY = CY;

  var trackingMode = 'none'; // 'none' | 'sequence' | 'cursor'

  /* ── Easing helpers ─────────────────────────────── */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── Apply pupil + iris + highlight position ────── */
  function applyEyePos(x, y) {
    if (!pupilEl || !irisEl) return;
    pupilEl.setAttribute('cx', x);
    pupilEl.setAttribute('cy', y);
    /* Iris follows with less travel (natural parallax) */
    irisEl.setAttribute('cx', lerp(CX, x, 0.48));
    irisEl.setAttribute('cy', lerp(CY, y, 0.48));
    /* Highlight tracks pupil */
    if (highlightEl) {
      highlightEl.setAttribute('cx', x + 14);
      highlightEl.setAttribute('cy', y - 11);
    }
  }

  /* ── Animation loop ─────────────────────────────── */
  var LERP_SPEED = 0.058;

  (function eyeLoop() {
    curX = lerp(curX, tgtX, LERP_SPEED);
    curY = lerp(curY, tgtY, LERP_SPEED);
    applyEyePos(curX, curY);
    requestAnimationFrame(eyeLoop);
  })();

  /* ── Move eye to a direction (sequence mode) ────── */
  var DIRECTIONS = {
    forward:      [CX,       CY      ],
    'down-left':  [CX - 30,  CY + 26 ],
    'down-center':[CX,       CY + 34 ],
    'down-right': [CX + 30,  CY + 26 ]
  };

  function eyeLookDirection(dir) {
    var pos = DIRECTIONS[dir] || DIRECTIONS.forward;
    tgtX = pos[0];
    tgtY = pos[1];
  }

  /* ── Iris widen (signals examine source button) ─── */
  function triggerIrisWiden(callback) {
    if (!irisEl) { if (callback) callback(); return; }
    irisEl.classList.add('widen');
    irisEl.addEventListener('animationend', function handler() {
      irisEl.classList.remove('widen');
      irisEl.removeEventListener('animationend', handler);
      if (callback) callback();
    });
  }

  /* ── Cursor tracking (starts after sequence ends) ── */
  function startCursorTracking() {
    trackingMode = 'cursor';
    LERP_SPEED = 0.072; // slightly snappier in tracking mode

    if (!isTouch) {
      /* Desktop: follow mouse */
      document.addEventListener('mousemove', function (e) {
        if (trackingMode !== 'cursor') return;
        var rect  = eyeWrap.getBoundingClientRect();
        var ecx   = rect.left + rect.width  / 2;
        var ecy   = rect.top  + rect.height / 2;
        var dx    = e.clientX - ecx;
        var dy    = e.clientY - ecy;
        var dist  = Math.sqrt(dx * dx + dy * dy);
        var angle = Math.atan2(dy, dx);
        var travel = Math.min(dist / 5.2, MAX_TRAVEL);
        tgtX = CX + Math.cos(angle) * travel;
        tgtY = CY + Math.sin(angle) * travel;
      }, { passive: true });
    } else {
      /* Mobile: random wander — more pronounced than homepage */
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

  /* ── Blink ──────────────────────────────────────── */
  function scheduleBlink() {
    setTimeout(function doBlink() {
      if (!eyeSvg) return;
      eyeSvg.style.transition = 'transform 65ms ease-in';
      eyeSvg.style.transform  = 'scaleY(0.04)';
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

  var T = {
    hold:        2500,   // hold "LIGHT LEAKS" title card
    eyeReveal:    100,   // start eye reveal this many ms after fade begins
    wordStart:    950,   // ms after fade starts, words begin
    wordStagger:  210,   // ms between each word
    btnStart:     1700,  // ms after first word starts, first button appears
    btnStagger:   820,   // ms between each button
    irisDelay:    700,   // ms after last button to widen iris
    trackDelay:   2100   // ms after iris widen, start cursor tracking
  };

  /* Phase 1 sequence kick-off */
  setTimeout(function startSequence() {

    /* Step 1: Fade out intro title card */
    intro.classList.add('fade-out');

    /* Step 2: Reveal scene container */
    scene.setAttribute('aria-hidden', 'false');
    scene.classList.add('visible');

    /* Step 3: Eye fades + scales in */
    setTimeout(function () {
      eyeWrap.classList.add('visible');
    }, T.eyeReveal);

    /* Step 4: Words blur-fade in one by one */
    words.forEach(function (word, i) {
      setTimeout(function () {
        word.classList.add('visible');
      }, T.wordStart + i * T.wordStagger);
    });

    /* Step 5 & 6: Buttons appear, eye gazes at each */
    var seqDirs = ['down-left', 'down-center', 'down-right'];
    var buttons = [btnShop, btnMusic, btnExamine];
    trackingMode = 'sequence';

    buttons.forEach(function (btn, i) {
      setTimeout(function () {
        if (btn) btn.classList.add('visible');
        eyeLookDirection(seqDirs[i]);
      }, T.btnStart + i * T.btnStagger);
    });

    /* Step 7: Iris widen after last button */
    var lastBtnTime = T.btnStart + (buttons.length - 1) * T.btnStagger;

    setTimeout(function () {
      eyeLookDirection('down-right'); // hold gaze on examine source
      if (btnExamine) btnExamine.classList.add('gazing');

      triggerIrisWiden(function () {
        /* After widen: ease back to forward, then start cursor tracking */
        eyeLookDirection('forward');
        if (btnExamine) btnExamine.classList.remove('gazing');
        setTimeout(function () {
          startCursorTracking();
          scheduleBlink();
        }, 500);
      });
    }, lastBtnTime + T.irisDelay);

    /* Clean up intro element */
    setTimeout(function () {
      intro.style.display = 'none';
    }, 1100);

  }, T.hold);

  /* ════════════════════════════════════════════════
     PHASE 2 — FLASHLIGHT / EXAMINE SOURCE
     ════════════════════════════════════════════════ */

  /* Flashlight beam radius (larger on touch for finger imprecision) */
  var FL_RADIUS = isTouch ? 135 : 112;
  var flActive  = false;

  /* RAF-throttled flashlight update */
  var pendingX = null, pendingY = null, flRaf = false;

  function applyFlashlight(x, y) {
    if (!llDark) return;
    var r = FL_RADIUS;
    var g = [
      'radial-gradient(circle ',
      r, 'px at ',
      x, 'px ',
      y, 'px,',
      'transparent 0%,',
      'transparent 50%,',
      'rgba(0,0,0,0.88) 72%,',
      '#0A0806 93%)'
    ].join('');
    llDark.style.webkitMaskImage = g;
    llDark.style.maskImage = g;
  }

  function queueFlashlight(x, y) {
    pendingX = x; pendingY = y;
    if (!flRaf) {
      flRaf = true;
      requestAnimationFrame(function () {
        if (pendingX !== null) applyFlashlight(pendingX, pendingY);
        flRaf = false;
      });
    }
  }

  /* Activate flashlight mode */
  function enterFlashlight() {
    if (!flashlight || flActive) return;
    flActive = true;

    /* Fade out tagline and buttons, but keep scene visible behind dark overlay */
    if (taglineEl) {
      taglineEl.style.transition = 'opacity 450ms ease';
      taglineEl.style.opacity    = '0';
    }
    if (navEl) {
      navEl.style.transition = 'opacity 450ms ease';
      navEl.style.opacity    = '0';
    }

    /* Start flashlight centered on the eye */
    var rect = eyeWrap ? eyeWrap.getBoundingClientRect() : null;
    var startX = rect ? rect.left + rect.width / 2  : window.innerWidth  / 2;
    var startY = rect ? rect.top  + rect.height / 2 : window.innerHeight / 2;
    applyFlashlight(startX, startY);

    /* Brief delay then show the dark overlay */
    setTimeout(function () {
      flashlight.setAttribute('aria-hidden', 'false');
      flashlight.classList.add('active');
    }, 280);

    /* Prevent body scroll during flashlight mode */
    document.body.style.overflow = 'hidden';
  }

  /* Exit flashlight mode */
  function exitFlashlight() {
    if (!flActive) return;
    flActive = false;

    flashlight.classList.remove('active');
    flashlight.setAttribute('aria-hidden', 'true');

    /* Restore tagline + buttons */
    setTimeout(function () {
      if (taglineEl) { taglineEl.style.transition = 'opacity 500ms ease'; taglineEl.style.opacity = '1'; }
      if (navEl)     { navEl.style.transition     = 'opacity 500ms ease'; navEl.style.opacity     = '1'; }
    }, 350);

    document.body.style.overflow = '';
  }

  /* ── Event listeners ────────────────────────────── */

  if (btnExamine) {
    btnExamine.addEventListener('click', enterFlashlight);
    btnExamine.addEventListener('touchend', function (e) {
      e.preventDefault();
      enterFlashlight();
    });
  }

  if (llClose) {
    llClose.addEventListener('click', exitFlashlight);
  }

  /* Mouse movement — feeds BOTH cursor tracking and flashlight */
  document.addEventListener('mousemove', function (e) {
    if (flActive) queueFlashlight(e.clientX, e.clientY);
  }, { passive: true });

  /* Touch movement — feeds flashlight on mobile */
  document.addEventListener('touchmove', function (e) {
    if (!flActive) return;
    var t = e.touches[0];
    queueFlashlight(t.clientX, t.clientY);
  }, { passive: true });

  /* Keyboard escape to exit */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && flActive) exitFlashlight();
  });

  /* Resize: recalculate flashlight radius */
  window.addEventListener('resize', function () {
    FL_RADIUS = window.matchMedia('(hover:none)').matches ? 135 : 112;
  }, { passive: true });

})();
