/* ============================================================
   MILEAGE MASTER — FRICTION MACRO SIMULATION
   Scroll-controlled visual interaction | friction.js
   ============================================================ */

export const initFrictionScene = async () => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;

  const section = document.getElementById('friction');
  const sticky = section?.querySelector('.friction-sticky');
  if (!section || !sticky) return;

  // DOM Elements
  const topSlab      = section.querySelector('.metal-top');
  const bottomSlab   = section.querySelector('.metal-bottom');
  const heatGlow     = section.querySelector('.heat-glow');
  const oilLayer     = section.querySelector('.oil-layer');
  const splashEl     = section.querySelector('.oil-splash-container');
  const oilDrops     = section.querySelectorAll('.oil-drop');
  const textGroup    = section.querySelector('.friction-text');

  // Meters
  const meterFriction   = section.querySelector('.meter-friction');
  const meterHeat       = section.querySelector('.meter-heat');
  const meterProtection = section.querySelector('.meter-protection');

  // ── Initial State: slabs pressed together, shuddering ─────
  topSlab.classList.add('is-shuddering');
  bottomSlab.classList.add('is-shuddering');
  
  // Continuous opposing slide to show metal-on-metal motion
  gsap.to(topSlab,    { x: '-20vw', duration: 10, repeat: -1, yoyo: true, ease: 'none' });
  gsap.to(bottomSlab, { x: '20vw',  duration: 10, repeat: -1, yoyo: true, ease: 'none' });

  // ── Master Scroll Timeline ───────────────────────────────
  const masterTl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      pin: sticky,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.0,
      onUpdate(self) {
        const p = self.progress;
        updateMeters(p, meterFriction, meterHeat, meterProtection);
        
        // Remove shudder when oil starts building up
        if (p > 0.45 && topSlab.classList.contains('is-shuddering')) {
          topSlab.classList.remove('is-shuddering');
          bottomSlab.classList.remove('is-shuddering');
        } else if (p <= 0.45 && !topSlab.classList.contains('is-shuddering')) {
          topSlab.classList.add('is-shuddering');
          bottomSlab.classList.add('is-shuddering');
        }
      }
    }
  });

  // ── Phase 1 (0–20%): Text fades in — friction hell ────────
  masterTl.fromTo(textGroup,
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1, duration: 0.2 },
    0
  );

  // ── Phase 2 (20–60%): Oil injects — slabs separate clearly ─
  // Slabs pull apart to reveal the gap where oil floods in
  masterTl.to(topSlab,    { y: '-38px', duration: 0.4, ease: 'power2.inOut' }, 0.2);
  masterTl.to(bottomSlab, { y: '38px',  duration: 0.4, ease: 'power2.inOut' }, 0.2);

  // Oil layer floods in — amber/golden liquid
  masterTl.fromTo(oilLayer,
    { opacity: 0, height: '0px' },
    { opacity: 1, height: '76px', duration: 0.4, ease: 'power2.inOut' },
    0.2
  );

  // Oil SPLASH droplets burst out as oil hits the metal
  if (splashEl) {
    masterTl.fromTo(splashEl,
      { opacity: 0 },
      { opacity: 1, duration: 0.1 },
      0.28  // Slightly after oil starts — the splash moment
    );

    // Each drop splashes outward from center
    oilDrops.forEach((drop, i) => {
      const dir = i % 2 === 0 ? -1 : 1;
      const angle = (i / oilDrops.length) * 360;
      const dist = 30 + (i * 8);
      masterTl.fromTo(drop,
        { 
          opacity: 0, 
          scale: 0, 
          x: 0, 
          y: 0 
        },
        { 
          opacity: 1, 
          scale: 1, 
          x: Math.cos(angle) * dist * dir,
          y: Math.sin(angle) * 20,
          duration: 0.12, 
          ease: 'back.out(2)',
          stagger: 0.01
        },
        0.3 + (i * 0.01)
      );
    });

    // Drops settle and absorb into oil film
    masterTl.to(oilDrops, { opacity: 0, y: '+=15', duration: 0.1, stagger: 0.01 }, 0.55);
    masterTl.to(splashEl, { opacity: 0, duration: 0.05 }, 0.65);
  }

  // ── Phase 3 (30–70%): Heat dissipates as oil protects ─────
  masterTl.to(heatGlow, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0.3);

  // ── Phase 4 (80–100%): Oil expands, transition out ────────
  masterTl.to(textGroup, { opacity: 0, duration: 0.1 }, 0.8);
  masterTl.to(oilLayer,  { height: '110vh', duration: 0.2, ease: 'power2.in' }, 0.8);
};

/* ── Dynamic Meter Updates ────────────────────────────────── */
const updateMeters = (p, frictionEl, heatEl, protEl) => {
  if (!frictionEl || !heatEl || !protEl) return;

  let frictionVal = 1.0;
  let heatVal     = 1.0;
  let protVal     = 0.0;

  if (p > 0.2 && p < 0.7) {
    const subP = (p - 0.2) / 0.5;
    frictionVal = 1.0 - subP;
    heatVal     = 1.0 - Math.pow(subP, 2);
    protVal     = subP;
  } else if (p >= 0.7) {
    frictionVal = 0.0;
    heatVal     = 0.0;
    protVal     = 1.0;
  }

  frictionEl.querySelector('.meter-fill').style.transform = `scaleY(${frictionVal})`;
  heatEl.querySelector('.meter-fill').style.transform     = `scaleY(${heatVal})`;
  protEl.querySelector('.meter-fill').style.transform     = `scaleY(${protVal})`;

  frictionEl.querySelector('.meter-value').textContent = frictionVal > 0.7 ? 'HIGH' : frictionVal > 0.3 ? 'MED' : 'LOW';

  const heatLabel = heatEl.querySelector('.meter-value');
  heatLabel.textContent = heatVal > 0.8 ? 'CRITICAL' : heatVal > 0.4 ? 'WARM' : 'STABLE';

  const heatFill = heatEl.querySelector('.meter-fill');
  if (heatVal > 0.8)      heatFill.style.background = 'var(--brand-red)';
  else if (heatVal > 0.4) heatFill.style.background = 'var(--oil-500)';
  else                    heatFill.style.background = 'var(--white-300)';

  protEl.querySelector('.meter-value').textContent = `${Math.floor(protVal * 100)}%`;
};
