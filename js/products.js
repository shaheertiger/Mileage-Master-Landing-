/* ============================================================
   MILEAGE MASTER — PRODUCT LABORATORY
   State management and GSAP UI transitions | products.js
   ============================================================ */

const PRODUCT_DATA = [
  {
    id: 0,
    name: "PRODUCT 01",
    viscosity: "SPECIFICATION TO BE PROVIDED",
    application: "SPECIFICATION TO BE PROVIDED",
    specification: "SPECIFICATION TO BE PROVIDED",
    engineType: "SPECIFICATION TO BE PROVIDED",
    hue: 0
  },
  {
    id: 1,
    name: "PRODUCT 02",
    viscosity: "SPECIFICATION TO BE PROVIDED",
    application: "SPECIFICATION TO BE PROVIDED",
    specification: "SPECIFICATION TO BE PROVIDED",
    engineType: "SPECIFICATION TO BE PROVIDED",
    hue: -40
  },
  {
    id: 2,
    name: "PRODUCT 03",
    viscosity: "SPECIFICATION TO BE PROVIDED",
    application: "SPECIFICATION TO BE PROVIDED",
    specification: "SPECIFICATION TO BE PROVIDED",
    engineType: "SPECIFICATION TO BE PROVIDED",
    hue: 40
  }
];

export const initLaboratoryScene = () => {
  const gsap = window.gsap;
  if (!gsap) return;

  const section = document.getElementById('laboratory');
  if (!section) return;

  const buttons = section.querySelectorAll('.automotive-btn');
  const bottle = section.querySelector('#lab-bottle-render');
  const nameText = section.querySelector('#lab-name-text');
  
  // Telemetry DOM elements
  const valViscosity = section.querySelector('#lab-val-viscosity');
  const valApplication = section.querySelector('#lab-val-application');
  const valSpec = section.querySelector('#lab-val-spec');
  const valEngine = section.querySelector('#lab-val-engine');

  let currentIndex = 0;
  let isAnimating = false;

  // Set initial text
  nameText.textContent = PRODUCT_DATA[0].name;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetIndex = parseInt(btn.dataset.product, 10);
      if (targetIndex === currentIndex || isAnimating) return;

      // Update active state on buttons
      buttons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      transitionProduct(targetIndex);
    });
  });

  const transitionProduct = (newIndex) => {
    isAnimating = true;
    const newData = PRODUCT_DATA[newIndex];
    const tl = gsap.timeline({
      onComplete: () => {
        currentIndex = newIndex;
        isAnimating = false;
      }
    });

    // 1. Animate Out
    tl.to([nameText, valViscosity, valApplication, valSpec, valEngine], {
      opacity: 0,
      y: -10,
      duration: 0.2,
      stagger: 0.02,
      ease: "power1.inOut"
    }, 0);

    // Spin bottle to 90deg (sideways/invisible)
    tl.to(bottle, {
      rotationY: 90,
      scale: 0.9,
      duration: 0.3,
      ease: "power2.in"
    }, 0);

    // 2. Update DOM Data
    tl.call(() => {
      nameText.textContent = newData.name;
      valViscosity.textContent = newData.viscosity;
      valApplication.textContent = newData.application;
      valSpec.textContent = newData.specification;
      valEngine.textContent = newData.engineType;
      
      // We apply a CSS hue-rotate to fake different bottles for now
      bottle.style.filter = `drop-shadow(0 40px 80px rgba(0,0,0,0.8)) hue-rotate(${newData.hue}deg)`;
    });

    // 3. Animate In (From -90deg)
    tl.fromTo(bottle, 
      { rotationY: -90, scale: 0.9 }, 
      { rotationY: 0, scale: 1, duration: 0.5, ease: "back.out(1.2)" }
    );

    tl.fromTo([nameText, valViscosity, valApplication, valSpec, valEngine],
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" },
      "-=0.3"
    );
  };
};
