/* ============================================================
   MILEAGE MASTER — INSIDE THE ENGINE SEQUENCE
   Video scrub and UI orchestrator | engine.js
   ============================================================ */

export const initEngineScene = async () => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;

  const section = document.getElementById('inside-engine');
  const sticky = section?.querySelector('.engine-sticky');
  const video = section?.querySelector('#engine-video');
  if (!section || !sticky) return;

  // We check if video duration is available. If not, we build the timeline anyway
  // so the UI still scrubs. When the user adds a video later, it will pick up the duration.
  if (video) {
    if (video.readyState > 0) {
      buildTimeline(gsap, section, sticky, video);
    } else {
      video.addEventListener('loadedmetadata', () => {
        buildTimeline(gsap, section, sticky, video);
      }, { once: true });
      
      // Fallback if no source is provided yet
      setTimeout(() => {
        if (video.readyState === 0 && !section.dataset.tlBuilt) {
          buildTimeline(gsap, section, sticky, video, true);
        }
      }, 150);
    }
  } else {
    buildTimeline(gsap, section, sticky, null, true);
  }
};

const buildTimeline = (gsap, section, sticky, video, isPlaceholder = false) => {
  section.dataset.tlBuilt = 'true';

  const masterTl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      pin: sticky,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.0,
      onUpdate(self) {
        if (video && !isPlaceholder && video.duration) {
          // Scrub video based on scroll progress
          video.currentTime = self.progress * video.duration;
        }
      }
    }
  });

  // UI Animation Setup (0.0 to 1.0 Timeline Progress)
  
  // 1. ENGINE BLOCK (0.05 -> 0.15)
  animateLabel(masterTl, section.querySelector('.label-block'), 0.05, 0.15);
  
  // 2. PISTON (0.2 -> 0.3)
  animateLabel(masterTl, section.querySelector('.label-piston'), 0.2, 0.3);
  
  // 3. CYLINDER WALL (0.35 -> 0.45)
  animateLabel(masterTl, section.querySelector('.label-cylinder'), 0.35, 0.45);
  
  // Cinematic Text 1: Friction (0.45 -> 0.55)
  const textFriction = section.querySelector('.text-friction');
  if (textFriction) {
    masterTl.fromTo(textFriction, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.03 }, 0.45);
    masterTl.to(textFriction, { opacity: 0, scale: 1.05, duration: 0.03 }, 0.55);
  }

  // 4. CRANKSHAFT (0.6 -> 0.7)
  animateLabel(masterTl, section.querySelector('.label-crankshaft'), 0.6, 0.7);
  
  // 5. OIL CHANNEL (0.75 -> 0.85)
  animateLabel(masterTl, section.querySelector('.label-channel'), 0.75, 0.85);

  // Cinematic Text 2: Solution (0.85 -> 0.95)
  const textSolution = section.querySelector('.text-solution');
  if (textSolution) {
    masterTl.fromTo(textSolution, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.03 }, 0.85);
    masterTl.to(textSolution, { opacity: 0, scale: 1.05, duration: 0.03 }, 0.95);
  }

  // 6. LUBRICATION POINTS (0.9 -> 1.0)
  animateLabel(masterTl, section.querySelector('.label-lube'), 0.9, 1.0);
};

const animateLabel = (tl, label, start, end) => {
  if (!label) return;
  const line = label.querySelector('.label-line');
  
  // Fade in and float up
  tl.fromTo(label, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.02 }, start);
  
  // Draw line (Width is manipulated in JS, relying on CSS for layout)
  if (line) {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      tl.fromTo(line, { height: 0 }, { height: 60, duration: 0.03, ease: 'power2.out' }, start + 0.01);
    } else {
      tl.fromTo(line, { width: 0 }, { width: 80, duration: 0.03, ease: 'power2.out' }, start + 0.01);
    }
  }
  
  // Fade out
  tl.to(label, { opacity: 0, y: -15, duration: 0.02 }, end);
};
