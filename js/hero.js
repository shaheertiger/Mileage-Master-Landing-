/* ============================================================
   MILEAGE MASTER — HERO CINEMATIC SEQUENCE CONTROLLER
   One continuous cinematic shot | hero.js
   ============================================================ */

import { emit, on, EVENTS } from './utils/events.js';
import { HeroSequence } from './hero-sequence.js';

export const initHero = async () => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;

  const hero = document.getElementById('hero');
  const sticky = hero?.querySelector('.hero__sticky');
  if (!hero || !sticky) return;

  // ── Element references ──────────────────────────────────
  const carLayer     = hero.querySelector('.hero__layer--car');
  const engineLayer  = hero.querySelector('.hero__layer--engine');
  const bottleLayer  = hero.querySelector('.hero__bottle-layer');
  const bottleGroup  = hero.querySelector('.bottle-group');
  const bottleCap    = hero.querySelector('.bottle-cap');
  const scrollHint   = hero.querySelector('.hero__scroll-hint');
  const narrative1   = hero.querySelector('#narrative-1');
  const narrative2   = hero.querySelector('#narrative-2');
  const narrative3   = hero.querySelector('#narrative-3');

  // Telemetry references
  const hudStatus = document.getElementById('hud-status');
  const hudRpm    = document.getElementById('hud-rpm');
  const hudTemp   = document.getElementById('hud-temp');
  const hudOil    = document.getElementById('hud-oil');

  // ── Kinetic title setup ──────────────────────────────────
  splitArrivalTitle(hero);

  // ── Master Scroll Timeline ───────────────────────────────
  const masterTl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      pin: sticky,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true, // instant 1:1 scroll mapping, zero lag
      onUpdate(self) {
        const p = self.progress;
        emit(EVENTS.HERO_SCROLL_PROGRESS, { progress: p });

        // Update telemetry HUD
        updateTelemetry(p, hudStatus, hudRpm, hudTemp, hudOil);

        // Hide scroll hint after user starts scrolling
        if (p > 0.02) scrollHint?.classList.add('hidden');
        else scrollHint?.classList.remove('hidden');
      }
    }
  });

  // ──────────────────────────────────────────────────────────
  // THE CINEMATIC SHOT (0 - 100%)
  // ═══════════════════════════════════════════════════════════

  const seq = new HeroSequence('hero-sequence-canvas');
  await seq.load();

  const playhead = { frame: 0 };

  // Intro Sequence (0-0.05): Fade in Nav
  const navElements = document.querySelectorAll('#nav .nav__links, #nav .nav-right');
  
  if (navElements.length) {
    masterTl.fromTo(navElements, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.05, ease: 'power1.inOut' }, 
      0
    );
  }

  // Phase 1 Text: PRECISION ENGINEERING
  masterTl.fromTo(narrative1, 
    { opacity: 0, x: -50 }, 
    { opacity: 1, x: 0, duration: 0.05, ease: 'power2.out' }, 
    0.15
  );
  masterTl.to(narrative1, { opacity: 0, duration: 0.05 }, 0.45);

  // Phase 2 Text: SYNTHETIC PROTECTION
  masterTl.fromTo(narrative2, 
    { opacity: 0, x: -50 }, 
    { opacity: 1, x: 0, duration: 0.05, ease: 'power2.out' }, 
    0.52
  );
  masterTl.to(narrative2, { opacity: 0, duration: 0.05 }, 0.70);

  // Phase 3 Text: MAXIMUM PERFORMANCE
  masterTl.fromTo(narrative3, 
    { opacity: 0, x: -50 }, 
    { opacity: 1, x: 0, duration: 0.05, ease: 'power2.out' }, 
    0.75
  );

  // Master sequence scrubber (0 - 1.0)
  masterTl.to(playhead, {
    frame: seq.totalFrames - 1,
    ease: 'none',
    duration: 1,
    onUpdate: () => seq.render(playhead.frame)
  }, 0);

  // ── Arrival animation (runs after loader completes) ──────
  on(EVENTS.LOADER_COMPLETE, () => playArrival(hero, gsap));
};

/* ── HUD Telemetry Logic ──────────────────────────────────── */
const updateTelemetry = (p, statusEl, rpmEl, tempEl, oilEl) => {
  if (!statusEl || !rpmEl || !tempEl || !oilEl) return;

  let status = 'STANDBY';
  let rpm = 0;
  let temp = 21;
  let oil = 0.0;
  let statusColor = 'var(--metal-400)';

  // 0-60%: Engine off, cold
  if (p < 0.6) {
    status = 'STANDBY';
    rpm = 0;
    temp = 21 + (p * 5); // Ambient slight rise
    oil = 0.0;
    statusColor = 'var(--metal-400)';
  }
  // 60-90%: Pre-ignition sequence
  else if (p < 0.9) {
    status = 'INITIALIZING';
    const subP = (p - 0.6) / 0.3; // 0 to 1
    rpm = subP * 1200;
    temp = 24 + (subP * 30);
    oil = subP * 1.5;
    statusColor = 'var(--oil-500)';
  }
  // 90-100%: Engine comes alive as oil pours
  else {
    status = 'SYSTEM NOMINAL';
    const subP = (p - 0.9) / 0.1; // 0 to 1
    // Aggressive curve for engine revs
    const revCurve = Math.pow(subP, 2);
    rpm = 1200 + (revCurve * 5800); // Revs to 7000
    temp = 54 + (subP * 38);        // Climbs to 92
    oil = 1.5 + (subP * 3.2);       // Peaks at 4.7 BAR
    statusColor = 'var(--brand-red)';
  }

  statusEl.textContent = status;
  statusEl.style.color = statusColor;

  rpmEl.textContent = String(Math.floor(rpm)).padStart(4, '0');
  tempEl.textContent = `${Math.floor(temp)}°C`;
  oilEl.textContent = `${oil.toFixed(1)} BAR`;
};

/* ── Split arrival title ──────────────────────────────────── */
const splitArrivalTitle = (hero) => {
  const titleLines = hero.querySelectorAll('.stage-arrival__title .line');
  titleLines.forEach(line => {
    const text = line.textContent.trim();
    const colorClass = line.getAttribute('data-color') || '';
    line.innerHTML = text.split(' ').map(w =>
      `<span style="display:inline-block; overflow:hidden; vertical-align:top; padding-right:0.05em">
        <span class="word ${colorClass}" style="display:inline-block; transform:translateY(110%)">${w}</span>
       </span>`
    ).join(' ');
  });
};

/* ── Arrival entrance animation ───────────────────────────── */
const playArrival = (hero, gsap) => {
  const words = hero.querySelectorAll('.stage-arrival__title .word');
  const sub = hero.querySelector('.stage-arrival__sub');

  const tl = gsap.timeline();

  tl.to(words, {
    y: 0,
    duration: 1.0,
    stagger: 0.1,
    ease: 'expo.out',
  }, 0.2);

  if (sub) {
    tl.fromTo(sub,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out' },
      1.0
    );
  }
};
