/* ============================================================
   MILEAGE MASTER — FRICTION IMAGE SEQUENCE
   High-end pre-rendered 3D sequence controlled by scroll
   ============================================================ */

export const initFrictionScene = async () => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  
  if (!gsap || !ScrollTrigger) return;

  const section = document.getElementById('friction');
  const sticky  = section?.querySelector('.friction-sticky');
  const canvas  = document.getElementById('piston-canvas');
  
  if (!section || !sticky || !canvas) return;

  const ctx = canvas.getContext('2d');
  
  // Meters & UI
  const meterFriction   = section.querySelector('.meter-friction');
  const meterHeat       = section.querySelector('.meter-heat');
  const meterProtection = section.querySelector('.meter-protection');
  const textGroup       = section.querySelector('.friction-text');

  // ── SEQUENCE SETUP ────────────────────────────────────────
  const frameCount = 250;
  const images = [];
  const sequence = { frame: 0 };
  let imagesLoaded = 0;
  let isReady = false;

  // Path template: assets/friction-sequence/ezgif-frame-001.jpg
  const currentFrame = index => (
    `assets/friction-sequence/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`
  );

  // Preload first frame immediately to establish dimensions
  const firstImage = new Image();
  firstImage.onload = () => {
    images[0] = firstImage;
    imagesLoaded++;
    resize(); // Size canvas based on aspect ratio
    renderFrame();
    preloadRemaining(); // Then background load the rest
  };
  firstImage.src = currentFrame(0);

  // Background loading function
  const preloadRemaining = () => {
    for (let i = 1; i < frameCount; i++) {
      const img = new Image();
      img.onload = () => {
        images[i] = img;
        imagesLoaded++;
        if (imagesLoaded === frameCount) isReady = true;
      };
      // Add fetch priority for smoother loading
      img.fetchPriority = "low";
      img.src = currentFrame(i);
    }
  };

  // ── CANVAS SCALING (COVER) ────────────────────────────────
  const resize = () => {
    if (!images[0]) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    // Physical pixels
    canvas.width = sticky.offsetWidth * dpr;
    canvas.height = sticky.offsetHeight * dpr;
    
    // CSS pixels
    canvas.style.width = `${sticky.offsetWidth}px`;
    canvas.style.height = `${sticky.offsetHeight}px`;
    
    ctx.scale(dpr, dpr);
    renderFrame();
  };
  
  window.addEventListener('resize', () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale before resize
    resize();
  }, { passive: true });

  // ── RENDER FUNCTION ───────────────────────────────────────
  const renderFrame = () => {
    const img = images[sequence.frame];
    if (!img) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate 'cover' object-fit equivalent for canvas
    const cW = sticky.offsetWidth;
    const cH = sticky.offsetHeight;
    const iW = img.width;
    const iH = img.height;
    
    const scale = Math.max(cW / iW, cH / iH);
    const x = (cW / 2) - (iW / 2) * scale;
    const y = (cH / 2) - (iH / 2) * scale;

    ctx.drawImage(img, x, y, iW * scale, iH * scale);
  };

  // ── SCROLL ANIMATION ──────────────────────────────────────
  ScrollTrigger.create({
    trigger: section,
    pin: sticky,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.0, // Smooth scrubbing
    onUpdate: (self) => {
      const p = self.progress;
      
      // Update UI Meters
      updateMeters(p, meterFriction, meterHeat, meterProtection);
    }
  });

  // GSAP Tween to scrub the frame index
  gsap.to(sequence, {
    frame: frameCount - 1,
    snap: 'frame',
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.0
    },
    onUpdate: () => requestAnimationFrame(renderFrame) // Use RAF for smooth painting
  });

  // Text fade in
  if (textGroup) gsap.fromTo(textGroup, { opacity: 0 }, { opacity: 1, duration: 0.5 });
};

/* ── Dynamic Meter Updates ────────────────────────────────── */
const updateMeters = (p, frictionEl, heatEl, protEl) => {
  if (!frictionEl || !heatEl || !protEl) return;

  let frictionVal = 1.0, heatVal = 1.0, protVal = 0.0;
  
  // Custom curve to match the visual timing of the video
  // Video usually starts dry, then oil pours in midway
  if (p > 0.25 && p < 0.7) {
    const sub = (p - 0.25) / 0.45;
    frictionVal = 1 - sub;
    heatVal     = 1 - Math.pow(sub, 2);
    protVal     = sub;
  } else if (p >= 0.7) {
    frictionVal = 0; heatVal = 0; protVal = 1;
  }

  frictionEl.querySelector('.meter-fill').style.transform = `scaleY(${frictionVal})`;
  heatEl.querySelector('.meter-fill').style.transform     = `scaleY(${heatVal})`;
  protEl.querySelector('.meter-fill').style.transform     = `scaleY(${protVal})`;
  
  frictionEl.querySelector('.meter-value').textContent    = frictionVal > 0.7 ? 'HIGH' : frictionVal > 0.3 ? 'MED' : 'LOW';
  
  const heatFill = heatEl.querySelector('.meter-fill');
  heatEl.querySelector('.meter-value').textContent = heatVal > 0.8 ? 'CRITICAL' : heatVal > 0.4 ? 'WARM' : 'STABLE';
  
  if (heatVal > 0.8)      heatFill.style.background = 'var(--brand-red)';
  else if (heatVal > 0.4) heatFill.style.background = 'var(--oil-500)';
  else                    heatFill.style.background = 'var(--white-300)';
  
  protEl.querySelector('.meter-value').textContent = `${Math.floor(protVal * 100)}%`;
};
