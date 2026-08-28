/* ============================================================
   MILEAGE MASTER — BRAND STORY SEQUENCE
   Horizontal scrolling and parallax effects | story.js
   ============================================================ */

export const initStoryScene = async () => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;

  const section = document.getElementById('story');
  const sticky = section?.querySelector('.story-sticky');
  const track = section?.querySelector('.story-track');
  const panels = section?.querySelectorAll('.story-panel');
  const images = section?.querySelectorAll('.parallax-img');

  if (!section || !sticky || !track || !panels) return;

  // Calculate the distance to move the track left.
  // Example: 6 panels means we move left by 5 viewport widths.
  // Using xPercent is better for performance and resizing.
  const distanceToTranslate = -100 * (panels.length - 1);

  const masterTl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      pin: sticky,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.0
    }
  });

  // 1. Slide the entire track horizontally
  masterTl.to(track, {
    xPercent: distanceToTranslate,
    ease: 'none',
    duration: 1
  }, 0);

  // 2. Parallax effect for the imagery
  // As the track slides left, the images slide right within their masked containers
  // creating a cinematic sense of depth.
  if (images && images.length > 0) {
    images.forEach((img) => {
      masterTl.fromTo(img, 
        { xPercent: -10 },
        { xPercent: 10, ease: 'none', duration: 1 },
        0
      );
    });
  }
};
