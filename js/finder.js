/* ============================================================
   MILEAGE MASTER — FIND YOUR OIL
   Interactive Configurator Logic | finder.js
   ============================================================ */

export const initFinderScene = () => {
  const gsap = window.gsap;
  if (!gsap) return;

  const steps = [
    document.getElementById('f-step-1'),
    document.getElementById('f-step-2'),
    document.getElementById('f-step-3'),
    document.getElementById('f-result')
  ];

  const summaryEl = document.getElementById('f-summary');
  const resetBtn = document.getElementById('f-reset');
  const navCta = document.getElementById('nav-cta');
  
  if (!steps[0]) return;

  let currentStep = 0;
  let userSelections = [];

  // Wire up Global Nav CTA to smooth scroll to Finder
  if (navCta) {
    navCta.addEventListener('click', (e) => {
      e.preventDefault();
      const finder = document.getElementById('finder');
      if (finder) {
        // Offset slightly for sticky nav if needed
        const y = finder.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  }

  const transitionToStep = (nextIndex) => {
    const currentEl = steps[currentStep];
    const nextEl = steps[nextIndex];

    if (!currentEl || !nextEl) return;

    // GSAP fade out current step
    gsap.to(currentEl, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      onComplete: () => {
        currentEl.classList.remove('active');
        
        // Prepare next step
        nextEl.classList.add('active');
        gsap.fromTo(nextEl, 
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
        
        currentStep = nextIndex;
      }
    });
  };

  const showResult = () => {
    // Populate placeholder result
    if (summaryEl) {
      summaryEl.textContent = userSelections.join(' / ');
    }
    // We leave the other [SPECIFICATION TO BE PROVIDED] elements alone
    // so they can be hooked up to a real JSON recommendation engine later.

    transitionToStep(3);
  };

  // Add event listeners to all buttons in each step
  steps.forEach((step, index) => {
    if (index === 3) return; // Skip result step

    const btns = step.querySelectorAll('.f-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-val');
        userSelections[index] = val;

        if (index < 2) {
          transitionToStep(index + 1);
        } else {
          showResult();
        }
      });
    });
  });

  // Reset logic
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      userSelections = [];
      transitionToStep(0);
    });
  }

  // Ensure first step is visible initially if active
  gsap.set(steps[0], { opacity: 1, y: 0 });
};
