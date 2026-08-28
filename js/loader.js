/* ============================================================
   MILEAGE MASTER — CINEMATIC LOADER CONTROLLER
   Automotive system boot sequence | loader.js
   ============================================================ */

import { emit, EVENTS } from './utils/events.js';

/* ── Timing constants ─────────────────────────────────────── */
const T = {
  FADE_IN:     180,   // ms — initial content fade-in
  FILL_START:  280,   // ms — delay before progress starts
  FILL_DUR:   1700,   // ms — total time for 0→100%
  READY_LAG:   120,   // ms after 100% before "SYSTEM READY"
  BTN_LAG:     320,   // ms after READY before button appears
  EXIT_DUR:    600,   // ms — cinematic exit animation
};

/* ── State ────────────────────────────────────────────────── */
let hasEntered  = false;
let enterBtn    = null;

/* ── Main init ────────────────────────────────────────────── */
export const initLoader = () => {
  const loader = document.getElementById('loader');
  if (!loader) return Promise.resolve();

  return new Promise((resolve) => {

    // ── Element refs ─────────────────────────────────────
    const center      = loader.querySelector('.loader__center');
    const statusText  = loader.querySelector('.loader__status-text');
    const dotsEl      = loader.querySelector('.loader__dots');
    const fill        = loader.querySelector('.loader__progress-fill');
    const tip         = loader.querySelector('.loader__progress-tip');
    const percentEl   = loader.querySelector('.loader__percent');
    enterBtn          = loader.querySelector('.loader__enter');
    const exitOverlay = loader.querySelector('.loader__exit-overlay');

    // ── Step 1: Fade in center content ───────────────────
    setTimeout(() => {
      loader.classList.add('is-ready'); // Reveals corner labels
      gsapFadeIn(center, T.FADE_IN);
    }, 80);

    // ── Step 2: Begin progress fill ──────────────────────
    setTimeout(() => {
      fill.classList.add('is-active');
      tip.style.opacity = '1';
      runProgress({ fill, tip, percentEl }, () => {

        // ── Step 3: At 100% ─────────────────────────────
        // Hide tip dot
        tip.style.opacity = '0';

        // Change status text after slight lag
        setTimeout(() => {
          dotsEl.classList.add('is-hidden');

          // Crossfade text
          statusText.style.transition = 'opacity 0.25s';
          statusText.style.opacity    = '0';

          setTimeout(() => {
            statusText.textContent = 'SYSTEM READY';
            statusText.classList.add('is-ready');
            statusText.style.opacity = '1';
          }, 260);

        }, T.READY_LAG);

        // ── Step 4: Show enter button ────────────────────
        setTimeout(() => {
          showEnterButton(enterBtn, resolve, loader, exitOverlay);
        }, T.READY_LAG + T.BTN_LAG);

      });
    }, T.FILL_START);
  });
};

/* ── Progress fill engine ─────────────────────────────────── */
const runProgress = ({ fill, tip, percentEl }, onComplete) => {
  const gsap = window.gsap;

  if (gsap) {
    // GSAP-driven: smooth easing, precise control
    const state = { v: 0 };
    gsap.to(state, {
      v: 100,
      duration: T.FILL_DUR / 1000,
      ease: 'power2.inOut',
      onUpdate() {
        applyProgress(fill, tip, percentEl, state.v);
      },
      onComplete,
    });
  } else {
    // Vanilla fallback: rAF loop
    const start = performance.now();
    const duration = T.FILL_DUR;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-in-out curve
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const pct = eased * 100;

      applyProgress(fill, tip, percentEl, pct);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };
    requestAnimationFrame(tick);
  }
};

const applyProgress = (fill, tip, percentEl, pct) => {
  const rounded = Math.round(pct);
  fill.style.width  = pct.toFixed(2) + '%';
  percentEl.textContent = rounded + '%';

  // Emit progress for any listening modules
  emit(EVENTS.LOADER_PROGRESS, { progress: pct / 100 });
};

/* ── Show enter button ────────────────────────────────────── */
const showEnterButton = (btn, resolve, loader, overlay) => {
  // Transition in
  btn.style.transition =
    'opacity 0.5s var(--ease-out-expo), transform 0.5s var(--ease-out-expo)';
  btn.classList.add('is-visible');

  // Click handler
  const handleEnter = () => {
    if (hasEntered) return;
    hasEntered = true;
    btn.removeEventListener('click', handleEnter);
    runExitAnimation(loader, overlay, resolve);
  };

  btn.addEventListener('click', handleEnter);

  // Keyboard: Enter / Space
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      document.removeEventListener('keydown', handleKey);
      handleEnter();
    }
  };
  document.addEventListener('keydown', handleKey);
};

/* ── Cinematic exit animation ─────────────────────────────── */
const runExitAnimation = (loader, overlay, resolve) => {
  const gsap = window.gsap;

  if (gsap) {
    const tl = gsap.timeline({
      onComplete() {
        loader.style.display = 'none';
        // Reveal main app
        const app = document.getElementById('app');
        if (app) app.classList.add('is-visible');
        emit(EVENTS.LOADER_COMPLETE);
        resolve();
      }
    });

    // 1. Fade out all center elements fast
    tl.to('.loader__center', {
      opacity: 0,
      y: -10,
      duration: 0.28,
      ease: 'power2.in',
    }, 0);

    tl.to('.loader__corner-label', {
      opacity: 0,
      duration: 0.2,
      stagger: 0.04,
    }, 0);

    // 2. Black overlay sweeps in from top
    tl.fromTo(overlay, {
      scaleY: 0,
      transformOrigin: 'top',
      opacity: 1,
    }, {
      scaleY: 1,
      duration: 0.35,
      ease: 'power3.in',
    }, 0.12);

    // 3. Hold black for 1 frame then dissolve
    tl.to(overlay, {
      opacity: 0,
      duration: 0.45,
      ease: 'power2.out',
      delay: 0.06,
    });

  } else {
    // Vanilla fallback: simple fade
    loader.style.transition = 'opacity 0.5s ease';
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
      const app = document.getElementById('app');
      if (app) app.classList.add('is-visible');
      emit(EVENTS.LOADER_COMPLETE);
      resolve();
    }, 520);
  }
};

/* ── GSAP fade-in helper ──────────────────────────────────── */
const gsapFadeIn = (el, duration = 400) => {
  const gsap = window.gsap;
  if (gsap) {
    gsap.fromTo(el,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: duration / 1000, ease: 'power2.out' }
    );
  } else {
    el.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
    el.style.opacity = '1';
    el.style.transform = 'none';
  }
};

/* ── Particle injection (kept minimal for performance) ──── */
export const startLoaderParticles = () => {
  // No particles in the new loader design.
  // Cleaner. More focused. Faster.
};
