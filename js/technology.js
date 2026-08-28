/* ============================================================
   MILEAGE MASTER — TECHNOLOGY SEQUENCE
   Circuit SVG and mechanical node orchestrator | technology.js
   ============================================================ */

export const initTechnologyScene = async () => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;

  const section = document.getElementById('technology');
  const sticky = section?.querySelector('.tech-sticky');
  const header = section?.querySelector('.tech-header');
  const pathActive = section?.querySelector('#tech-path-active');
  const nodes = section?.querySelectorAll('.tech-node');

  if (!section || !sticky || !pathActive || !nodes) return;

  const masterTl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      pin: sticky,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.0,
      onUpdate: (self) => {
        const p = self.progress;
        
        // Node activation thresholds mapped to their physical positions (20%, 45%, 70%, 95%)
        nodes.forEach((node, index) => {
          const thresholds = [0.15, 0.40, 0.65, 0.90];
          
          // We keep previous nodes active as the line passes them, 
          // or we can deactivate them to keep focus. 
          // Keeping them active looks better for a 'filling' circuit.
          if (p >= thresholds[index]) {
            node.classList.add('is-active');
          } else {
            node.classList.remove('is-active');
          }
        });
      }
    }
  });

  // 1. Fade in Header
  masterTl.to(header, { opacity: 1, duration: 0.1 }, 0);

  // 2. Draw the golden oil line down the circuit (0 to 1 progress)
  // path length is 100, stroke-dashoffset goes from 100 to 0
  masterTl.fromTo(pathActive, 
    { strokeDashoffset: 100 }, 
    { strokeDashoffset: 0, duration: 1.0, ease: 'none' }, 
    0
  );

  // 3. Fade out Header near the end to transition to Products
  masterTl.to(header, { opacity: 0, duration: 0.1 }, 0.9);
};
