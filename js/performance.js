/* ============================================================
   MILEAGE MASTER — ENGINE PERFORMANCE SEQUENCE
   Video scrub, RPM counter, and shake/blur orchestrator | performance.js
   ============================================================ */

export const initPerformanceScene = async () => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;

  const section = document.getElementById('performance');
  const sticky = section?.querySelector('.perf-sticky');
  const videoWrapper = section?.querySelector('.perf-video-wrapper');
  const video = section?.querySelector('#perf-video');
  const rpmGroup = section?.querySelector('.perf-rpm');
  const rpmValue = section?.querySelector('.rpm-value');
  const climax = section?.querySelector('.perf-climax');
  
  if (!section || !sticky) return;

  // Set up GSAP proxy object for the RPM counter
  const rpmCounter = { val: 0 };

  // Wait for video metadata to know duration, or fallback
  if (video) {
    if (video.readyState > 0) {
      buildTimeline(gsap, section, sticky, videoWrapper, video, rpmGroup, rpmValue, climax, rpmCounter);
    } else {
      video.addEventListener('loadedmetadata', () => {
        buildTimeline(gsap, section, sticky, videoWrapper, video, rpmGroup, rpmValue, climax, rpmCounter);
      }, { once: true });
      
      setTimeout(() => {
        if (video.readyState === 0 && !section.dataset.tlBuilt) {
          buildTimeline(gsap, section, sticky, videoWrapper, video, rpmGroup, rpmValue, climax, rpmCounter, true);
        }
      }, 150);
    }
  } else {
    buildTimeline(gsap, section, sticky, videoWrapper, null, rpmGroup, rpmValue, climax, rpmCounter, true);
  }
};

const buildTimeline = (gsap, section, sticky, wrapper, video, rpmGroup, rpmValue, climax, rpmCounter, isPlaceholder = false) => {
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

        // Scrub video
        if (video && !isPlaceholder && video.duration) {
          video.currentTime = p * video.duration;
        }

        // Apply dynamic camera shake and motion blur to the wrapper
        // The shake intensity is exponentially proportional to scroll progress
        if (wrapper) {
          if (p > 0.1 && p < 0.85) {
            // Map p (0.1 -> 0.85) to intensity (0 -> 1)
            const linearIntensity = (p - 0.1) / 0.75;
            // Square it for exponential growth feeling
            const intensity = Math.pow(linearIntensity, 2);
            
            // X and Y shake ranges from 0px to ~20px
            const maxShake = 20 * intensity;
            const rx = (Math.random() - 0.5) * maxShake * 2;
            const ry = (Math.random() - 0.5) * maxShake * 2;
            
            // Blur ranges from 0px to ~8px
            const maxBlur = 8 * intensity;
            const blur = maxBlur;

            // Small scale pulses to simulate violent G-forces
            const scale = 1.0 + (Math.random() * 0.05 * intensity);

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

  // 0-10%: Fade in video and RPM counter
  if (video) masterTl.to(video, { opacity: 1, duration: 0.1 }, 0);
  if (rpmGroup) masterTl.fromTo(rpmGroup, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.1 }, 0);

  // 10-85%: Ramp RPM from 0 to 6000
  if (rpmValue) {
    masterTl.to(rpmCounter, {
      val: 6000,
      duration: 0.75, // 0.1 to 0.85
      ease: 'power2.in',
      onUpdate: () => {
        // Pad with leading zeros
        rpmValue.textContent = Math.floor(rpmCounter.val).toString().padStart(4, '0');
      }
    }, 0.1);
  }

  // 85-90%: Fade out video and RPM counter
  if (video) masterTl.to(video, { opacity: 0, duration: 0.05 }, 0.85);
  if (rpmGroup) masterTl.to(rpmGroup, { opacity: 0, scale: 1.1, duration: 0.05 }, 0.85);

  // 90-100%: Fade in Climax text
  if (climax) {
    masterTl.fromTo(climax, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.05 }, 0.9);
    masterTl.to(climax, { opacity: 0, y: -20, duration: 0.05 }, 0.95);
  }
};
