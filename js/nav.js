/* ============================================================
   MILEAGE MASTER — NAVIGATION CONTROLLER
   Scroll behavior + active section + mobile menu | nav.js
   ============================================================ */

import { on, EVENTS } from './utils/events.js';

/* ── Element refs ─────────────────────────────────────────── */
const nav        = document.getElementById('nav');
const overlay    = document.getElementById('nav-overlay');
const hamburger  = document.getElementById('nav-hamburger');
const links      = nav?.querySelectorAll('.nav__link');
const overlayLinks = overlay?.querySelectorAll('.nav-overlay__link');

/* ── State ────────────────────────────────────────────────── */
let isMenuOpen     = false;
let activeSection  = '';
let scrollRAF      = null;

/* ════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════ */

export const initNav = () => {
  if (!nav) return;

  setupScrollBehavior();
  setupActiveSection();
  setupMobileMenu();
  setupLinkClicks();

  // Run once on init for current scroll position
  onScroll();
};

/* ════════════════════════════════════════════════════════════
   SCROLL BEHAVIOR
   3 states: transparent → subtle → solid graphite
   ════════════════════════════════════════════════════════════ */

const onScroll = () => {
  const y = window.scrollY;

  // Subtle state: 80–240px of scroll
  const isSubtle = y > 80  && y < 240;
  // Solid state:  240px+
  const isSolid  = y >= 240;

  nav.classList.toggle('nav--subtle', isSubtle);
  nav.classList.toggle('nav--solid',  isSolid);

  scrollRAF = null;
};

const setupScrollBehavior = () => {
  window.addEventListener('scroll', () => {
    if (scrollRAF) return;
    scrollRAF = requestAnimationFrame(onScroll);
  }, { passive: true });
};

/* ════════════════════════════════════════════════════════════
   ACTIVE SECTION DETECTION
   Uses IntersectionObserver for precision.
   Updates both desktop links and mobile overlay links.
   ════════════════════════════════════════════════════════════ */

const SECTION_IDS = ['hero', 'engine', 'products', 'technology', 'about'];

// Map section IDs to nav link data-target values
const SECTION_TO_NAV = {
  'hero':       'engine',    // hero maps to first real nav link
  'engine':     'engine',
  'products':   'products',
  'technology': 'technology',
  'about':      'about',
};

const setActiveLink = (sectionId) => {
  const target = SECTION_TO_NAV[sectionId] || sectionId;
  if (activeSection === target) return;
  activeSection = target;

  // Desktop links
  links?.forEach(link => {
    const isActive = link.dataset.target === target;
    link.classList.toggle('is-active', isActive);
  });

  // Mobile overlay links
  overlayLinks?.forEach(link => {
    const isActive = link.dataset.target === target;
    link.classList.toggle('is-active', isActive);
  });
};

const setupActiveSection = () => {
  // IntersectionObserver — triggers when section enters viewport
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActiveLink(entry.target.id);
      }
    });
  }, {
    // Top offset = nav height (64px), bottom = cut off at 40% of viewport
    rootMargin: '-64px 0px -40% 0px',
    threshold:  0,
  });

  SECTION_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });

  // Default: first visible is 'engine' once past hero
  setActiveLink('hero');
};

/* ════════════════════════════════════════════════════════════
   MOBILE MENU
   Full-screen overlay slides in from right.
   Hamburger transforms to ×.
   ════════════════════════════════════════════════════════════ */

const openMenu = () => {
  isMenuOpen = true;
  overlay?.classList.add('is-open');
  hamburger?.classList.add('is-open');
  hamburger?.setAttribute('aria-expanded', 'true');
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
  // Focus the overlay for accessibility
  overlay?.setAttribute('aria-hidden', 'false');
  // Focus first link after animation settles
  setTimeout(() => {
    overlay?.querySelector('.nav-overlay__link')?.focus();
  }, 350);
};

const closeMenu = () => {
  isMenuOpen = false;
  overlay?.classList.remove('is-open');
  hamburger?.classList.remove('is-open');
  hamburger?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  overlay?.setAttribute('aria-hidden', 'true');
  // Return focus to hamburger
  hamburger?.focus();
};

const toggleMenu = () => {
  isMenuOpen ? closeMenu() : openMenu();
};

const setupMobileMenu = () => {
  if (!hamburger || !overlay) return;

  // Set initial ARIA state
  overlay.setAttribute('aria-hidden', 'true');

  // Toggle on hamburger click
  hamburger.addEventListener('click', toggleMenu);

  // Close button inside overlay
  const closeBtn = overlay.querySelector('.nav-overlay__close');
  closeBtn?.addEventListener('click', closeMenu);

  // Close on backdrop click (clicking outside links)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMenu();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen) closeMenu();
  });

  // Close on resize to desktop breakpoint
  const mq = window.matchMedia('(min-width: 961px)');
  mq.addEventListener('change', (e) => {
    if (e.matches && isMenuOpen) closeMenu();
  });
};

/* ════════════════════════════════════════════════════════════
   LINK CLICK BEHAVIOR
   Smooth scroll to section + close mobile menu if open.
   ════════════════════════════════════════════════════════════ */

const scrollToSection = (targetId) => {
  const el = document.getElementById(targetId);
  if (!el) return;

  const navH = nav?.offsetHeight ?? 64;
  const top  = el.getBoundingClientRect().top + window.scrollY - navH;

  window.scrollTo({ top, behavior: 'smooth' });
};

const setupLinkClicks = () => {
  // Desktop nav links
  links?.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.target;
      if (target) scrollToSection(target);
    });
  });

  // Mobile overlay links
  overlayLinks?.forEach(link => {
    link.addEventListener('click', () => {
      const target = link.dataset.target;
      if (target) {
        closeMenu();
        // Small delay so overlay closes first
        setTimeout(() => scrollToSection(target), 120);
      }
    });
  });

  // CTA buttons — scroll to products
  const ctaBtns = document.querySelectorAll('.nav__cta-btn, .nav-overlay__cta');
  ctaBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isMenuOpen) {
        closeMenu();
        setTimeout(() => scrollToSection('products'), 120);
      } else {
        scrollToSection('products');
      }
    });
  });
};

/* ════════════════════════════════════════════════════════════
   EVENT BUS INTEGRATION
   ════════════════════════════════════════════════════════════ */

// Hide nav during loader, show after LOADER_COMPLETE
on(EVENTS.LOADER_COMPLETE, () => {
  nav?.classList.add('nav--revealed');
});
