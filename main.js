/* ============================================
   ENTROPI COACHING - Global Scripts
   ============================================ */

// Reveal on scroll. Content remains visible when the API is unavailable or
// when the visitor has asked for reduced motion.
const revealElements = document.querySelectorAll('.reveal');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && !reduceMotion) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), 60);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  revealElements.forEach(el => obs.observe(el));
} else {
  revealElements.forEach(el => el.classList.add('visible'));
}

// Mobile menu
const hamburger = document.querySelector('.nav-hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
if (hamburger && mobileMenu) {
  const menuId = mobileMenu.id || 'mobile-navigation';
  mobileMenu.id = menuId;
  hamburger.setAttribute('aria-controls', menuId);
  hamburger.setAttribute('aria-expanded', 'false');

  const closeMenu = ({ restoreFocus = false } = {}) => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (restoreFocus) hamburger.focus();
  };

  hamburger.addEventListener('click', () => {
    const isOpen = !mobileMenu.classList.contains('open');
    hamburger.classList.toggle('open', isOpen);
    mobileMenu.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (isOpen) mobileMenu.querySelector('a')?.focus();
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeMenu());
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu({ restoreFocus: true });
    }
  });
}
