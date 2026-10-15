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

const carousel = document.querySelector('.menu-carousel');
const carouselTrack = carousel?.querySelector('.menu-track');
const carouselToggle = document.querySelector('[data-carousel-toggle]');
const carouselCounter = document.querySelector('[data-carousel-counter]');
const originalCarouselCards = carouselTrack ? [...carouselTrack.querySelectorAll('.menu-card')] : [];
originalCarouselCards.forEach((card, index) => { card.dataset.carouselIndex = String(index); });
let carouselPaused = false;
let carouselLoopWidth = 0;
let carouselPosition = 0;
let carouselPreviousTime = 0;
let carouselResizeTimer;
let featuredCarouselCard = null;
const carouselSpeed = 104;

const updateCardFocus = () => {
  if (!carousel || !carouselTrack) return;
  const carouselBounds = carousel.getBoundingClientRect();
  const carouselCenter = carouselBounds.left + carouselBounds.width / 2;
  let closestCard = null;
  let closestDistance = Infinity;
  const compactLayout = window.innerWidth <= 600;
  const focusStates = [];

  carouselTrack.querySelectorAll('.menu-card').forEach((card) => {
    const bounds = card.getBoundingClientRect();
    const signedDistance = bounds.left + bounds.width / 2 - carouselCenter;
    const distance = Math.abs(signedDistance);
    const focusRadius = Math.max(card.offsetWidth * 1.65, carouselBounds.width * .3);
    const proximity = Math.max(0, Math.min(1, 1 - distance / focusRadius));
    const focus = proximity * proximity * (3 - 2 * proximity);
    const minimumScale = compactLayout ? .95 : .94;
    const maximumScale = compactLayout ? 1.035 : 1.065;
    const direction = Math.max(-1, Math.min(1, signedDistance / focusRadius));

    focusStates.push({ card, focus, direction, minimumScale, maximumScale });

    if (distance < closestDistance) {
      closestDistance = distance;
      closestCard = card;
    }
  });

  focusStates.forEach(({ card, focus, direction, minimumScale, maximumScale }) => {
    card.style.setProperty('--card-scale', (minimumScale + (maximumScale - minimumScale) * focus).toFixed(4));
    card.style.setProperty('--card-opacity', ((compactLayout ? .88 : .84) + focus * (compactLayout ? .12 : .16)).toFixed(3));
    card.style.setProperty('--card-border', (.12 + focus * .76).toFixed(3));
    card.style.setProperty('--card-glow', (.005 + focus * .075).toFixed(3));
    card.style.setProperty('--card-lift', `${((1 - focus) * (compactLayout ? 9 : 17)).toFixed(2)}px`);
    card.style.setProperty('--card-rotate', `${(direction * (compactLayout ? -1.1 : -2.4)).toFixed(2)}deg`);
    card.style.setProperty('--accent-width', `${(18 + focus * 82).toFixed(1)}%`);
    card.style.setProperty('--copy-shift', `${((1 - focus) * 5).toFixed(2)}px`);
    card.style.setProperty('--card-saturation', (1.06 + focus * .1).toFixed(3));
    card.style.setProperty('--card-contrast', (1.03 + focus * .03).toFixed(3));
    card.style.setProperty('--card-brightness', (1 + focus * .04).toFixed(3));
  });

  if (closestCard !== featuredCarouselCard) {
    featuredCarouselCard?.classList.remove('is-featured');
    closestCard?.classList.add('is-featured');
    featuredCarouselCard = closestCard;
    const featuredIndex = Number(closestCard?.dataset.carouselIndex || 0) + 1;
    if (carouselCounter) {
      carouselCounter.textContent = `${String(featuredIndex).padStart(2, '0')} / ${String(originalCarouselCards.length).padStart(2, '0')}`;
    }
  }
};

const buildCarouselLoop = () => {
  if (!carouselTrack || !originalCarouselCards.length) return;
  carouselTrack.querySelectorAll('[data-carousel-clone]').forEach((card) => card.remove());

  const trackStyles = getComputedStyle(carouselTrack);
  const gap = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;
  carouselLoopWidth = originalCarouselCards.reduce((width, card) => width + card.offsetWidth, 0)
    + gap * originalCarouselCards.length;

  const copiesNeeded = Math.max(3, Math.ceil(window.innerWidth / carouselLoopWidth) + 2);
  const clones = document.createDocumentFragment();
  for (let copy = 1; copy < copiesNeeded; copy += 1) {
    originalCarouselCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.classList.remove('is-featured');
      clone.dataset.carouselClone = '';
      clone.setAttribute('aria-hidden', 'true');
      clones.appendChild(clone);
    });
  }
  carouselTrack.appendChild(clones);

  carouselPosition = -carouselLoopWidth;
  carouselTrack.style.transform = `translate3d(${carouselPosition}px, 0, 0)`;
  featuredCarouselCard = null;
  updateCardFocus();
};

const moveCarousel = (time) => {
  if (!carouselTrack) return;
  if (!carouselPreviousTime) carouselPreviousTime = time;
  const elapsed = Math.min((time - carouselPreviousTime) / 1000, 0.05);
  carouselPreviousTime = time;

  if (!carouselPaused && carouselLoopWidth > 0) {
    carouselPosition += carouselSpeed * elapsed;
    if (carouselPosition >= 0) carouselPosition -= carouselLoopWidth;
    carouselTrack.style.transform = `translate3d(${carouselPosition}px, 0, 0)`;
    carouselTrack.dataset.offset = String(Math.round(carouselPosition));
  }

  updateCardFocus();

  requestAnimationFrame(moveCarousel);
};

if (carouselTrack) {
  requestAnimationFrame(() => {
    buildCarouselLoop();
    requestAnimationFrame(moveCarousel);
  });
  window.addEventListener('resize', () => {
    clearTimeout(carouselResizeTimer);
    carouselResizeTimer = setTimeout(buildCarouselLoop, 160);
  }, { passive: true });
}

carouselToggle?.addEventListener('click', () => {
  carouselPaused = !carouselPaused;
  carousel?.classList.toggle('is-paused', carouselPaused);
  carouselToggle.setAttribute('aria-pressed', String(carouselPaused));
  carouselToggle.setAttribute('aria-label', carouselPaused ? 'Continuar carrossel' : 'Pausar carrossel');
  carouselToggle.querySelector('span').textContent = carouselPaused ? '▶' : 'Ⅱ';
});

document.querySelector('[data-year]').textContent = new Date().getFullYear();
