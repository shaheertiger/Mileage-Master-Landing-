/* ============================================================
   MILEAGE MASTER — FINALE SEQUENCE & FOOTER
   Video scrub, camera shake, and footer transition | finale.js
   ============================================================ */

export const initFinaleScene = async () => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;

  const section = document.getElementById('finale');
  const sticky = section?.querySelector('.fin-sticky');
  const videoWrapper = section?.querySelector('.fin-video-wrapper');
  const video = section?.querySelector('#fin-video');
  const headlights = section?.querySelector('.fin-headlights');
  const footer = section?.querySelector('.fin-footer');

  if (!section || !sticky) return;

  if (video) {
    if (video.readyState > 0) {
      buildTimeline(gsap, section, sticky, videoWrapper, video, headlights, footer);
    } else {
      video.addEventListener('loadedmetadata', () => {
        buildTimeline(gsap, section, sticky, videoWrapper, video, headlights, footer);
      }, { once: true });
      
      setTimeout(() => {
        if (video.readyState === 0 && !section.dataset.tlBuilt) {
          buildTimeline(gsap, section, sticky, videoWrapper, video, headlights, footer, true);
        }
      }, 150);
    }
  } else {
    buildTimeline(gsap, section, sticky, videoWrapper, null, headlights, footer, true);
  }
};

const buildTimeline = (gsap, section, sticky, wrapper, video, headlights, footer, isPlaceholder = false) => {
  section.dataset.tlBuilt = 'true';

  const masterTl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      pin: sticky,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.0,
      onUpdate(self) {
        const p = self.progress;

        // Scrub video backwards out of engine (0 to 50%)
        if (video && !isPlaceholder && video.duration && p <= 0.5) {
          // Map 0-0.5 scroll progress to 0-100% video scrub
          const scrubRatio = p / 0.5;
          video.currentTime = scrubRatio * video.duration;
        }

        // Apply dynamic camera shake and motion blur to simulate acceleration (60% to 85%)
        if (wrapper) {
          if (p > 0.60 && p < 0.85) {
            // Map p (0.60 -> 0.85) to intensity (0 -> 1)
            const linearIntensity = (p - 0.60) / 0.25;
            const intensity = Math.pow(linearIntensity, 2); // Exponential growth for violent effect
            
            const maxShake = 30 * intensity;
            const rx = (Math.random() - 0.5) * maxShake * 2;
            const ry = (Math.random() - 0.5) * maxShake * 2;
            
            const maxBlur = 15 * intensity;
            const blur = maxBlur;

            const scale = 1.0 + (Math.random() * 0.1 * intensity);

            wrapper.style.transform = `translate(${rx}px, ${ry}px) scale(${scale})`;
            wrapper.style.filter = `blur(${blur}px)`;
          } else {
            wrapper.style.transform = `translate(0px, 0px) scale(1)`;
            wrapper.style.filter = `blur(0px)`;
          }
        }
      }
    }
  });

  // 0-5%: Fade in video
  if (video) masterTl.to(video, { opacity: 1, duration: 0.05 }, 0);

  // 50-60%: Headlights snap on (pause beat before acceleration)
  if (headlights) {
    masterTl.fromTo(headlights, { opacity: 0 }, { opacity: 1, duration: 0.02 }, 0.5);
  }

  // 85-90%: The blur wipes the screen, fading out video and headlights
  masterTl.to(wrapper, { opacity: 0, duration: 0.05 }, 0.85);
  
  // 90-100%: Fade in the final clean Brand Footer scene
  if (footer) {
    masterTl.fromTo(footer, 
      { opacity: 0, y: 40, pointerEvents: 'none' }, 
      { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.05 }, 
      0.9
    );
  }
};
