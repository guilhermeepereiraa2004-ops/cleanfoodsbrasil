const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  mobileMenu?.classList.toggle('is-open', open);
  mobileMenu?.setAttribute('aria-hidden', String(!open));
  menuButton?.setAttribute('aria-expanded', String(open));
  menuButton?.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}

menuButton?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

const revealItems = document.querySelectorAll('.reveal');
if (reducedMotion) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const siblings = [...(entry.target.parentElement?.children || [])].filter((el) => el.classList.contains('reveal'));
      const delay = Math.min(siblings.indexOf(entry.target) * 90, 270);
      entry.target.style.transitionDelay = `${delay}ms`;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
  revealItems.forEach((item) => observer.observe(item));
}

const parallax = document.querySelector('[data-parallax]');
if (parallax && !reducedMotion && window.innerWidth > 880) {
  window.addEventListener('scroll', () => {
    const offset = Math.min(window.scrollY * 0.055, 34);
    parallax.style.transform = `translate3d(0, ${offset}px, 0)`;
  }, { passive: true });
}

document.querySelectorAll('[data-tilt]').forEach((card) => {
  if (reducedMotion || window.matchMedia('(pointer: coarse)').matches) return;
  card.addEventListener('pointermove', (event) => {
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    card.style.transform = `rotateX(${-y * 4}deg) rotateY(${x * 5}deg) translateY(-4px)`;
  });
  card.addEventListener('pointerleave', () => { card.style.transform = ''; });
});

document.querySelector('[data-year]').textContent = new Date().getFullYear();
