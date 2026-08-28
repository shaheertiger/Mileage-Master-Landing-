/* ============================================================
   MILEAGE MASTER — APPLICATION ENTRY POINT
   Bootstrap sequence: GSAP → Nav → Hero → Loader | main.js
   ============================================================ */

import { initGSAP }                       from './utils/gsap-init.js';
import { TIER }                           from './utils/device.js';
import { emit, EVENTS }                   from './utils/events.js';
import { initHero }                       from './hero.js';
import { initEngineScene }                from './engine.js';
import { initFrictionScene }              from './friction.js';
import { initPerformanceScene }           from './performance.js';
import { initComparisonScene }            from './comparison.js';
import { initTechnologyScene }            from './technology.js';
import { initFinderScene }                from './finder.js';
import { initLaboratoryScene }            from './products.js';
import { initStoryScene }                 from './story.js';
import { initFinaleScene }                from './finale.js';
import { initTweakner }                   from './tweakner.js';

/*
 * Bootstrap sequence:
 * 1. GSAP + ScrollTrigger init
 * 2. Nav init (immediately functional)
 * 3. Hero setup (registers ScrollTrigger, awaits LOADER_COMPLETE)
 * 4. Loader runs → user clicks START EXPERIENCE
 * 5. LOADER_COMPLETE emitted → hero entrance animation fires
 */

const init = async () => {

  // ── 1. GSAP ──────────────────────────────────────────────
  const gsapReady = initGSAP();

  if (!gsapReady) {
    // CDN may still be loading — wait up to 3s then proceed
    await waitForGSAP(3000);
    if (!window.gsap) {
      console.warn('[MM] GSAP not available. Degraded experience.');
      document.documentElement.dataset.animDisabled = 'true';
      // Skip loader, reveal immediately
      const loader = document.getElementById('loader');
      if (loader) loader.style.display = 'none';
      const app = document.getElementById('app');
      if (app) app.classList.add('is-visible');
      emit(EVENTS.LOADER_COMPLETE);
      return;
    }
  }

  // ── 2. Navigation ─────────────────────────────────────────
  // initNav();

  // ── 3. Hero scene setup ───────────────────────────────────
  // Runs setup, waits for LOADER_COMPLETE to animate entrance
  await initHero();

  // ── 4. Inside the Engine setup ────────────────────────────
  await initEngineScene();

  // ── 5. Friction sequence setup ────────────────────────────
  await initFrictionScene();

  // ── 6. Performance sequence setup ─────────────────────────
  await initPerformanceScene();

  // ── 7. Comparison sequence setup ──────────────────────────
  initComparisonScene();

  // ── 8. Technology sequence setup ──────────────────────────
  await initTechnologyScene();

  // ── 8. Finder sequence setup ──────────────────────────────
  initFinderScene();

  // ── 9. Laboratory sequence setup ──────────────────────────
  initLaboratoryScene();

  // ── 10. Brand Story sequence setup ────────────────────────
  await initStoryScene();

  // ── 11. Finale sequence setup ─────────────────────────────
  await initFinaleScene();

  // ── 11.5 Live Design Tweakner (hidden — re-enable when needed) ──
  // initTweakner();

  // ── 12. Start Experience ──────────────────────────────────
  // Trigger hero animation immediately since loader is removed
  emit(EVENTS.LOADER_COMPLETE);

  // ── 13. Global resize ─────────────────────────────────────
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      emit(EVENTS.RESIZE, { w: window.innerWidth, h: window.innerHeight });
      window.ScrollTrigger?.refresh();
    }, 250);
  }, { passive: true });

  // Dev info
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log(`%c[Mileage Master] Device tier: ${TIER}`, 'color:#C41230;font-weight:bold');
  }
};

/* ── Wait for GSAP CDN load ──────────────────────────────── */
const waitForGSAP = (maxMs) => new Promise((resolve) => {
  if (window.gsap) return resolve();
  const start = Date.now();
  const check = () => {
    if (window.gsap || Date.now() - start > maxMs) return resolve();
    setTimeout(check, 100);
  };
  check();
});

/* ── Run ─────────────────────────────────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
