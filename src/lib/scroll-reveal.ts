const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];

// Content is visible by default, including when JavaScript is unavailable.
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const reveal = (target: HTMLElement) => {
    target.dataset.revealState = 'visible';
    observer.unobserve(target);
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) reveal(entry.target as HTMLElement);
    });
  }, { rootMargin: '0px 0px -24px 0px', threshold: 0 });

  targets.forEach((target) => {
    // Avoid hiding already-visible content on slow loads or restored scroll positions.
    if (target.getBoundingClientRect().top < innerHeight) return;
    target.dataset.revealState = 'pending';
    observer.observe(target);
  });

  document.addEventListener('focusin', (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLElement>('[data-reveal-state="pending"]');
    if (target) reveal(target);
  });

  const revealAll = () => {
    targets.forEach((target) => { delete target.dataset.revealState; });
    observer.disconnect();
  };
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) revealAll();
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) revealAll();
  });
  window.addEventListener('beforeprint', revealAll);
}
