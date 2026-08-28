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
  const topSlab = section.querySelector('.metal-top');
  const bottomSlab = section.querySelector('.metal-bottom');
  const heatGlow = section.querySelector('.heat-glow');
  const oilLayer = section.querySelector('.oil-layer');
  const textGroup = section.querySelector('.friction-text');

  // Meters
  const meterFriction = section.querySelector('.meter-friction');
  const meterHeat = section.querySelector('.meter-heat');
  const meterProtection = section.querySelector('.meter-protection');

  // Initial State Setup
  topSlab.classList.add('is-shuddering');
  bottomSlab.classList.add('is-shuddering');
  
  // Continuous horizontal slide while shuddering
  gsap.to(topSlab, { x: '-20vw', duration: 10, repeat: -1, yoyo: true, ease: 'none' });
  gsap.to(bottomSlab, { x: '20vw', duration: 10, repeat: -1, yoyo: true, ease: 'none' });

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
        
        // Remove shudder when oil starts building up (around 45%)
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

  // 0-20%: Text fades in, high friction state maintained
  masterTl.fromTo(textGroup, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.2 }, 0);

  // 20-60%: Oil injects, slabs separate slightly
  masterTl.to(topSlab, { y: '-25px', duration: 0.4, ease: 'power1.inOut' }, 0.2);
  masterTl.to(bottomSlab, { y: '25px', duration: 0.4, ease: 'power1.inOut' }, 0.2);
  masterTl.fromTo(oilLayer, { opacity: 0, height: '0px' }, { opacity: 1, height: '60px', duration: 0.4, ease: 'power1.inOut' }, 0.2);

  // 30-70%: Heat dissipates as oil spreads
  masterTl.to(heatGlow, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0.3);

  // 80-100%: Oil expands to fill screen (transition to next section)
  masterTl.to(textGroup, { opacity: 0, duration: 0.1 }, 0.8);
  masterTl.to(oilLayer, { height: '110vh', duration: 0.2, ease: 'power2.in' }, 0.8);
};

/* ── Dynamic Meter Updates ────────────────────────────────── */
const updateMeters = (p, frictionEl, heatEl, protEl) => {
  if (!frictionEl || !heatEl || !protEl) return;

  // Values map from 0.0 to 1.0
  let frictionVal = 1.0;
  let heatVal = 1.0;
  let protVal = 0.0;

  // 0.2 to 0.7 is the active transition zone
  if (p > 0.2 && p < 0.7) {
    const subP = (p - 0.2) / 0.5; // 0 to 1
    frictionVal = 1.0 - subP;
    heatVal = 1.0 - Math.pow(subP, 2); // Heat drops slightly later
    protVal = subP;
  } else if (p >= 0.7) {
    frictionVal = 0.0;
    heatVal = 0.0;
    protVal = 1.0;
  }

  // Update DOM: Track fills
  frictionEl.querySelector('.meter-fill').style.transform = `scaleY(${frictionVal})`;
  heatEl.querySelector('.meter-fill').style.transform = `scaleY(${heatVal})`;
  protEl.querySelector('.meter-fill').style.transform = `scaleY(${protVal})`;

  // Update DOM: Labels
  frictionEl.querySelector('.meter-value').textContent = frictionVal > 0.7 ? 'HIGH' : frictionVal > 0.3 ? 'MED' : 'LOW';
  
  const heatLabel = heatEl.querySelector('.meter-value');
  heatLabel.textContent = heatVal > 0.8 ? 'CRITICAL' : heatVal > 0.4 ? 'WARM' : 'STABLE';
  
  // Transition heat track color based on value
  const heatFill = heatEl.querySelector('.meter-fill');
  if (heatVal > 0.8) heatFill.style.background = 'var(--brand-red)';
  else if (heatVal > 0.4) heatFill.style.background = 'var(--oil-500)';
  else heatFill.style.background = 'var(--white-300)';

  protEl.querySelector('.meter-value').textContent = `${Math.floor(protVal * 100)}%`;
};
