(function () {
  const nodes = document.querySelectorAll("[data-parallax]");

  if (!nodes.length) {
    return;
  }

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const update = () => {
    const viewport = window.innerHeight || 1;

    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const delta = (midpoint - viewport / 2) / viewport;
      const offset = clamp(delta * -24, -24, 24);
      node.style.transform = `translateY(${offset}px)`;
    });
  };

  let ticking = false;
  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  requestTick();
})();
