/* ============================================================
   MILEAGE MASTER — PRODUCT LABORATORY
   State management and GSAP UI transitions | products.js
   ============================================================ */

const VIEW_DATA = [
  {
    id: 0,
    image: "assets/images/product-1.jpg"
  },
  {
    id: 1,
    image: "assets/images/product-2.jpg"
  },
  {
    id: 2,
    image: "assets/images/product-3.jpg"
  }
];

export const initLaboratoryScene = () => {
  const gsap = window.gsap;
  if (!gsap) return;

  const section = document.getElementById('laboratory');
  if (!section) return;

  const buttons = section.querySelectorAll('.automotive-btn');
  const bottle = section.querySelector('#lab-bottle-render');
  
  let currentIndex = 0;
  let isAnimating = false;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Use data-view instead of data-product
      const targetIndex = parseInt(btn.dataset.view || btn.dataset.product, 10);
      if (targetIndex === currentIndex || isAnimating) return;

      // Update active state on buttons
      buttons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      transitionView(targetIndex);
    });
  });

  const transitionView = (newIndex) => {
    isAnimating = true;
    const newData = VIEW_DATA[newIndex];
    const tl = gsap.timeline({
      onComplete: () => {
        currentIndex = newIndex;
        isAnimating = false;
      }
    });

    // 1. Animate Out (Spin bottle sideways)
    tl.to(bottle, {
      rotationY: 90,
      scale: 0.9,
      duration: 0.25,
      ease: "power2.in"
    });

    // 2. Swap Image Source
    tl.call(() => {
      // Remove any previously applied hue-rotates from placeholder logic
      bottle.style.filter = `drop-shadow(0 40px 80px rgba(0,0,0,0.8))`;
      bottle.src = newData.image;
    });

    // 3. Animate In (From -90deg)
    tl.fromTo(bottle, 
      { rotationY: -90, scale: 0.9 }, 
      { rotationY: 0, scale: 1, duration: 0.4, ease: "back.out(1.2)" }
    );
  };
};
