/* ============================================================
   MILEAGE MASTER — FRICTION MACRO SIMULATION
   Scroll-controlled visual interaction | friction.js
   ============================================================ */

export const initFrictionScene = async () => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;

  const section = document.getElementById('friction');
  const sticky  = section?.querySelector('.friction-sticky');
  if (!section || !sticky) return;

  // DOM Elements
  const discTop      = section.querySelector('.disc-top');
  const discBottom   = section.querySelector('.disc-bottom');
  const contactZone  = section.querySelector('.contact-zone');
  const heatGlow     = section.querySelector('.heat-glow');
  const oilLayer     = section.querySelector('.oil-layer');
  const textGroup    = section.querySelector('.friction-text');

  // Meters
  const meterFriction   = section.querySelector('.meter-friction');
  const meterHeat       = section.querySelector('.meter-heat');
  const meterProtection = section.querySelector('.meter-protection');

  // ── Initial State: discs pressed together, shuddering ─────
  discTop.classList.add('is-shuddering');
  discBottom.classList.add('is-shuddering');

  // Opposing slide — metal grinding against metal
  gsap.to(discTop,    { x: '-6vw', duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to(discBottom, { x: '6vw',  duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut' });

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

        // Stop shudder once oil builds up
        if (p > 0.45 && discTop.classList.contains('is-shuddering')) {
          discTop.classList.remove('is-shuddering');
          discBottom.classList.remove('is-shuddering');
        } else if (p <= 0.45 && !discTop.classList.contains('is-shuddering')) {
          discTop.classList.add('is-shuddering');
          discBottom.classList.add('is-shuddering');
        }
      }
    }
  });

  // ── Phase 1 (0–20%): Text in, high friction ───────────────
  masterTl.fromTo(textGroup,
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1, duration: 0.2 },
    0
  );

  // ── Phase 2 (20–60%): Oil injects — discs separate ────────
  // Discs pull apart revealing the contact zone
  masterTl.to(discTop,    { y: '-50px', duration: 0.4, ease: 'power2.inOut' }, 0.2);
  masterTl.to(discBottom, { y: '50px',  duration: 0.4, ease: 'power2.inOut' }, 0.2);

  // Contact zone expands as discs separate
  masterTl.to(contactZone, { height: '120px', duration: 0.4, ease: 'power2.inOut' }, 0.2);

  // Oil floods in with animated waves — already animating via CSS
  masterTl.fromTo(oilLayer,
    { opacity: 0 },
    { opacity: 1, duration: 0.35, ease: 'power2.inOut' },
    0.22
  );

  // Heat glow fades out as oil takes over
  masterTl.to(heatGlow, { opacity: 0, duration: 0.35, ease: 'power2.out' }, 0.28);

  // ── Phase 3 (80–100%): Transition out ─────────────────────
  masterTl.to(textGroup, { opacity: 0, duration: 0.1 }, 0.8);
  // Oil floods full screen
  masterTl.to(contactZone, { height: '110vh', duration: 0.2, ease: 'power2.in' }, 0.8);
};

/* ── Dynamic Meter Updates ────────────────────────────────── */
const updateMeters = (p, frictionEl, heatEl, protEl) => {
  if (!frictionEl || !heatEl || !protEl) return;

  let frictionVal = 1.0, heatVal = 1.0, protVal = 0.0;

  if (p > 0.2 && p < 0.7) {
    const subP = (p - 0.2) / 0.5;
    frictionVal = 1.0 - subP;
    heatVal     = 1.0 - Math.pow(subP, 2);
    protVal     = subP;
  } else if (p >= 0.7) {
    frictionVal = 0.0; heatVal = 0.0; protVal = 1.0;
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
