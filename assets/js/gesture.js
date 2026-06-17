(function () {
  const cards = document.querySelectorAll("[data-tilt]");

  cards.forEach((card) => {
    let frame = null;

    const setTilt = (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 8;
      const rotateY = (x - 0.5) * 8;
      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    };

    const reset = () => {
      card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
    };

    card.addEventListener("pointermove", (event) => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(() => setTilt(event));
    });

    card.addEventListener("pointerleave", reset);
    card.addEventListener("blur", reset);
  });
})();
