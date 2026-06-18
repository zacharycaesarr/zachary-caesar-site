(function () {

  /* ── Scroll reveal ─────────────────────────────── */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach((el) => obs.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* ── Year ──────────────────────────────────────── */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ── Music: tracklist toggle ───────────────────── */
  document.querySelectorAll('.album-card').forEach((card) => {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.tracklist-close')) return;
      if (e.target.closest('.album-footer a, .album-footer button')) return;
      const wasOpen = card.classList.contains('open');
      document.querySelectorAll('.album-card.open').forEach((c) => c.classList.remove('open'));
      if (!wasOpen) card.classList.add('open');
    });
  });

  document.querySelectorAll('.tracklist-close').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.closest('.album-card').classList.remove('open');
    });
  });

  /* ── Shop: quick view on touch devices ─────────── */
  const isTouchDevice = () => window.matchMedia('(hover: none)').matches;

  if (isTouchDevice()) {
    document.querySelectorAll('.product-card').forEach((card) => {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.qv-actions a, .qv-actions button')) return;
        const wasOpen = card.classList.contains('open');
        document.querySelectorAll('.product-card.open').forEach((c) => c.classList.remove('open'));
        if (!wasOpen) card.classList.add('open');
      });
    });
  }

  /* ── Word-by-word reveal ────────────────────────── */
  document.querySelectorAll('[data-word-reveal]').forEach(function (el) {
    // Split into individual word spans
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w, i) {
      return '<span class="word" style="--wi:' + i + '">' + w + '</span>';
    }).join(' ');

    // Trigger when element enters viewport
    if ('IntersectionObserver' in window) {
      var wordObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.word').forEach(function (span) {
              span.classList.add('visible');
            });
            wordObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      wordObs.observe(el);
    } else {
      el.querySelectorAll('.word').forEach(function (span) {
        span.classList.add('visible');
      });
    }
  });

  /* ── Scroll hint: fade in via class, nudge after 3s, hide at bottom ── */
  const scrollHint = document.querySelector('.scroll-hint');
  if (scrollHint) {
    /* Fade the hint in after 2.2s (class-based, no CSS animation conflict) */
    setTimeout(function () {
      scrollHint.classList.add('visible');
    }, 2200);

    /* Nudge pulse if user still hasn't scrolled after 3s */
    var nudgeTimer = setTimeout(function () {
      if (window.scrollY < 10 && scrollHint.classList.contains('visible')) {
        scrollHint.classList.add('scroll-hint--nudge');
        setTimeout(function () {
          scrollHint.classList.remove('scroll-hint--nudge');
          /* Re-ensure it's visible after nudge ends (belt-and-suspenders) */
          scrollHint.classList.add('visible');
          scrollHint.classList.remove('gone');
        }, 3900);
      }
    }, 3000);

    /* On scroll: clear nudge, hide only at page bottom */
    window.addEventListener('scroll', function () {
      clearTimeout(nudgeTimer);
      scrollHint.classList.remove('scroll-hint--nudge');

      var docEl    = document.documentElement;
      var atBottom = (window.scrollY + window.innerHeight) >= (docEl.scrollHeight - 50);

      if (atBottom) {
        scrollHint.classList.remove('visible');
        scrollHint.classList.add('gone');
      } else {
        /* If they scroll back up from near-bottom, restore hint */
        scrollHint.classList.remove('gone');
        scrollHint.classList.add('visible');
      }
    }, { passive: true });
  }

  /* ── Cart count (updated by Shopify Buy Button JS) */
  window.__zcUpdateCartCount = function (n) {
    document.querySelectorAll('.cart-count').forEach((el) => {
      el.textContent = n;
      el.style.display = n > 0 ? '' : 'none';
    });
  };
  window.__zcUpdateCartCount(0);

})();
