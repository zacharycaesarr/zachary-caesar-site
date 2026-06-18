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

  /* ── Scroll hint: hide after first scroll ──────── */
  const scrollHint = document.querySelector('.scroll-hint');
  if (scrollHint) {
    window.addEventListener('scroll', function hideHint() {
      if (window.scrollY > 40) {
        scrollHint.style.transition = 'opacity 0.5s ease';
        scrollHint.style.opacity = '0';
        window.removeEventListener('scroll', hideHint);
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
