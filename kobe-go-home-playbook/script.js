document.addEventListener("DOMContentLoaded", () => {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const dots = Array.from(document.querySelectorAll(".slide-dot"));
  const previousButton = document.querySelector('[data-action="prev"]');
  const nextButton = document.querySelector('[data-action="next"]');
  const currentDisplay = document.querySelector(".slide-progress-current");
  const totalDisplay = document.querySelector(".slide-progress-total");

  if (!slides.length) return;

  const totalSlides = slides.length;
  let currentSlide = 1;

  const formatSlideNumber = (value) => String(value).padStart(2, "0");

  const updateControls = () => {
    if (currentDisplay) currentDisplay.textContent = formatSlideNumber(currentSlide);
    if (totalDisplay) totalDisplay.textContent = formatSlideNumber(totalSlides);
    if (previousButton) previousButton.disabled = currentSlide === 1;
    if (nextButton) nextButton.disabled = currentSlide === totalSlides;
  };

  const goToSlide = (slideNumber) => {
    const clampedSlide = Math.min(Math.max(slideNumber, 1), totalSlides);
    currentSlide = clampedSlide;

    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === clampedSlide - 1);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === clampedSlide - 1);
      dot.setAttribute("aria-current", index === clampedSlide - 1 ? "true" : "false");
    });

    updateControls();
  };

  const nextSlide = () => goToSlide(currentSlide + 1);
  const previousSlide = () => goToSlide(currentSlide - 1);

  if (previousButton) {
    previousButton.addEventListener("click", previousSlide);
  }

  if (nextButton) {
    nextButton.addEventListener("click", nextSlide);
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const target = Number(dot.dataset.target);
      if (!Number.isNaN(target)) goToSlide(target);
    });
  });

  document.addEventListener("keydown", (event) => {
    const activeTag = document.activeElement?.tagName;
    if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      nextSlide();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousSlide();
    }
  });

  const printBtn = document.querySelector('[data-action="print"]');
  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }

  goToSlide(1);
});
