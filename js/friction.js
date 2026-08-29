/* ============================================================
   MILEAGE MASTER — PISTON ENGINE CANVAS SIMULATION
   4-cylinder inline engine | friction.js
   
   State machine:
     0.0 – 0.25  → Dry engine: slow, jerky, heat shimmer, red glow
     0.25 – 0.55 → Oil injection: golden oil floods in from below
     0.55 – 1.0  → Oiled engine: fast, smooth, golden sheen
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
  const meterFriction   = section.querySelector('.meter-friction');
  const meterHeat       = section.querySelector('.meter-heat');
  const meterProtection = section.querySelector('.meter-protection');
  const textGroup       = section.querySelector('.friction-text');

  // ── Engine state (driven by scroll) ───────────────────────
  const state = {
    progress: 0,      // 0→1 from scroll
    crankAngle: 0,    // radians, continuously advancing
    oilLevel: 0,      // 0→1
    speed: 0.8,       // radians per frame (increases with oil)
    heatAlpha: 1.0,
    jitter: 3,        // px shake for dry state
    time: 0,
  };

  // Resize canvas to fill container at 2× DPR
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = sticky.offsetWidth  * dpr;
    canvas.height = sticky.offsetHeight * dpr;
    canvas.style.width  = sticky.offsetWidth  + 'px';
    canvas.style.height = sticky.offsetHeight + 'px';
    ctx.scale(dpr, dpr);
  };
  resize();
  window.addEventListener('resize', () => { ctx.setTransform(1,0,0,1,0,0); resize(); }, { passive: true });

  // ── Scroll trigger updates state ──────────────────────────
  ScrollTrigger.create({
    trigger: section,
    pin: sticky,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate(self) {
      const p = self.progress;
      state.progress = p;

      // Oil floods in between 0.25 and 0.55
      if (p < 0.25) {
        state.oilLevel = 0;
        state.speed    = 0.018 + Math.random() * 0.008; // slow & jerky
        state.jitter   = 3;
        state.heatAlpha = 1.0;
      } else if (p < 0.55) {
        const sub = (p - 0.25) / 0.30;
        state.oilLevel  = sub;
        state.speed     = 0.018 + sub * 0.07;
        state.jitter    = 3 * (1 - sub);
        state.heatAlpha = 1 - sub;
      } else {
        state.oilLevel  = 1;
        state.speed     = 0.088; // fast & smooth
        state.jitter    = 0;
        state.heatAlpha = 0;
      }

      updateMeters(p, meterFriction, meterHeat, meterProtection);
    }
  });

  // Text fade in
  if (textGroup) gsap.fromTo(textGroup, { opacity: 0 }, { opacity: 1, duration: 0.5 });

  // ── RENDER LOOP ───────────────────────────────────────────
  let rafId;
  const W = () => canvas.width  / (window.devicePixelRatio <= 2 ? Math.min(window.devicePixelRatio, 2) : 2);
  const H = () => canvas.height / (window.devicePixelRatio <= 2 ? Math.min(window.devicePixelRatio, 2) : 2);

  const draw = () => {
    rafId = requestAnimationFrame(draw);
    state.time++;
    state.crankAngle += state.speed;

    const w = sticky.offsetWidth;
    const h = sticky.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#070707';
    ctx.fillRect(0, 0, w, h);

    // Draw the engine
    drawEngine(ctx, w, h, state);
  };

  draw();

  // Clean up on section leave
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onLeave: () => cancelAnimationFrame(rafId),
    onEnterBack: () => draw(),
  });
};

/* ─────────────────────────────────────────────────────────── 
   HYPER-REALISTIC ENGINE DRAWING (Pseudo-3D Canvas)
   ─────────────────────────────────────────────────────────── */
function drawEngine(ctx, W, H, state) {
  const { crankAngle, oilLevel, heatAlpha, jitter, time } = state;

  // Engine layout constants
  const N = 4;                         // cylinders
  const crankR  = H * 0.085;          // crank throw radius
  const rodLen  = H * 0.24;           // connecting rod length
  const pistonW = Math.min(W / 8, 140);
  const pistonH = pistonW * 0.8;
  const cylW    = pistonW + 24;
  const cylH    = H * 0.45;
  const spacing = W / (N + 1);
  const crankY  = H * 0.75;           // crankshaft Y centre
  const topWall = H * 0.05;           // top of cylinders

  // Fire order offsets: 1-3-4-2 → 0°, 180°, 270°, 90°
  const fireOffsets = [0, Math.PI, Math.PI * 1.5, Math.PI * 0.5];

  // ── OIL FLOOD from bottom ─────────────────────────────────
  if (oilLevel > 0) {
    const oilTop = H - (H * 0.85 * oilLevel);
    const oilGrad = ctx.createLinearGradient(0, oilTop, 0, H);
    oilGrad.addColorStop(0,   `rgba(255, 180, 20, ${Math.min(oilLevel, 0.95)})`);
    oilGrad.addColorStop(0.3, `rgba(180, 110, 5,  ${Math.min(oilLevel, 0.95)})`);
    oilGrad.addColorStop(1,   `rgba(80,  40,  0,  ${Math.min(oilLevel, 0.98)})`);
    ctx.fillStyle = oilGrad;
    ctx.fillRect(0, oilTop, W, H - oilTop);

    // Dynamic oil surface wave & froth
    if (oilLevel > 0.05) {
      ctx.beginPath();
      ctx.moveTo(0, oilTop);
      for (let x = 0; x <= W; x += 10) {
        // Complex wave function for fluid look
        const waveY = oilTop + (Math.sin(x * 0.01 + time * 0.15) * 5 + Math.cos(x * 0.02 - time * 0.1) * 3) * oilLevel;
        ctx.lineTo(x, waveY);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = `rgba(255,210,60,${oilLevel * 0.4})`;
      ctx.fill();
      
      // Surface highlight
      ctx.beginPath();
      ctx.moveTo(0, oilTop);
      for (let x = 0; x <= W; x += 10) {
        const waveY = oilTop + (Math.sin(x * 0.01 + time * 0.15) * 5 + Math.cos(x * 0.02 - time * 0.1) * 3) * oilLevel;
        ctx.lineTo(x, waveY);
      }
      ctx.strokeStyle = `rgba(255,240,180,${oilLevel * 0.8})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  // ── HEAT SHIMMER BACKGROUND (dry state) ───────────────────
  if (heatAlpha > 0) {
    const hg = ctx.createRadialGradient(W/2, H*0.5, 0, W/2, H*0.5, W*0.7);
    hg.addColorStop(0,   `rgba(220, 30, 0, ${0.4 * heatAlpha})`);
    hg.addColorStop(0.5, `rgba(120, 10, 20, ${0.2 * heatAlpha})`);
    hg.addColorStop(1,   'transparent');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, W, H);
  }

  // Helper: Chrome/Steel metal gradient for cylinders/rods
  const getChromeGradient = (x1, y1, x2, y2) => {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, '#111');
    g.addColorStop(0.15, '#555');
    g.addColorStop(0.25, '#fff'); // Sharp specular highlight
    g.addColorStop(0.35, '#888');
    g.addColorStop(0.6, '#333');
    g.addColorStop(0.8, '#666'); // Edge bounce light
    g.addColorStop(1, '#0a0a0a');
    return g;
  };

  const jx = jitter > 0 ? (Math.random() - 0.5) * jitter : 0;
  const jy = jitter > 0 ? (Math.random() - 0.5) * jitter : 0;
  ctx.save();
  ctx.translate(jx, jy);

  // ── 1. ENGINE BLOCK / CYLINDERS (Background) ─────────────
  for (let i = 0; i < N; i++) {
    const cx = spacing * (i + 1);
    const wallX = cx - cylW / 2;
    
    // Deep cast iron cylinder bore
    const boreGrad = ctx.createLinearGradient(wallX, 0, wallX + cylW, 0);
    boreGrad.addColorStop(0,    '#050505');
    boreGrad.addColorStop(0.1,  '#1a1a1a');
    boreGrad.addColorStop(0.5,  '#2a2a2a');
    boreGrad.addColorStop(0.9,  '#1a1a1a');
    boreGrad.addColorStop(1,    '#050505');
    ctx.fillStyle = boreGrad;
    ctx.fillRect(wallX, topWall, cylW, cylH);
    
    // Cylinder bevel/edge
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 4;
    ctx.strokeRect(wallX, topWall, cylW, cylH);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(wallX - 2, topWall - 2, cylW + 4, cylH + 4);
    
    // Top deck plate
    const deckGrad = ctx.createLinearGradient(wallX - 10, topWall - 30, wallX - 10, topWall);
    deckGrad.addColorStop(0, '#888');
    deckGrad.addColorStop(1, '#333');
    ctx.fillStyle = deckGrad;
    ctx.fillRect(wallX - 12, topWall - 25, cylW + 24, 25);
    // Deck highlight
    ctx.fillStyle = '#aaa';
    ctx.fillRect(wallX - 12, topWall - 25, cylW + 24, 2);
  }

  // ── 2. CRANKSHAFT & RODS (Back-to-Front layering) ───────
  
  // A. Main Journals (The axis the crank spins on)
  const mainJournalGrad = ctx.createLinearGradient(0, crankY - 20, 0, crankY + 20);
  mainJournalGrad.addColorStop(0, '#222');
  mainJournalGrad.addColorStop(0.2, '#999');
  mainJournalGrad.addColorStop(0.5, '#eee');
  mainJournalGrad.addColorStop(0.8, '#444');
  mainJournalGrad.addColorStop(1, '#111');
  
  ctx.fillStyle = mainJournalGrad;
  ctx.fillRect(spacing * 0.4, crankY - 18, spacing * (N + 0.2), 36);
  
  // Dark shadow lines for main journal gaps
  for (let i = 0; i <= N; i++) {
    const x = spacing * 0.5 + i * spacing;
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 5, crankY - 20, 10, 40);
  }

  // Pre-calculate positions
  const pistons = [];
  for (let i = 0; i < N; i++) {
    const cx = spacing * (i + 1);
    const angle = crankAngle + fireOffsets[i];
    const crankPinX = cx + crankR * Math.sin(angle);
    const crankPinY = crankY - crankR * Math.cos(angle);
    const ratio = crankR / rodLen;
    const pistonY = crankY - crankR * Math.cos(angle) - rodLen * Math.sqrt(1 - Math.pow(ratio * Math.sin(angle), 2));
    pistons.push({ i, cx, angle, crankPinX, crankPinY, pistonY, z: Math.cos(angle) });
  }

  // Sort by Z (crank angle depth) so rods rotating backwards are drawn first
  // Actually, standard inline engine rods don't overlap much, but crank counterweights do.
  // We'll just draw sequentially, it's an orthographic-ish projection anyway.

  for (let p of pistons) {
    const { cx, angle, crankPinX, crankPinY, pistonY } = p;
    const px = cx - pistonW / 2;
    const py = pistonY;
    const wristPinY = py + pistonH * 0.6; // Where rod connects to piston

    // ── B. Crankshaft Counterweights ──
    ctx.save();
    ctx.translate(cx, crankY);
    ctx.rotate(-angle); // rotate to match throw
    
    // Draw heavy metallic lobe
    const lobeGrad = ctx.createLinearGradient(-30, 0, 30, 0);
    lobeGrad.addColorStop(0, '#111'); lobeGrad.addColorStop(0.5, '#555'); lobeGrad.addColorStop(1, '#111');
    ctx.fillStyle = lobeGrad;
    ctx.beginPath();
    ctx.moveTo(-40, 20);
    ctx.lineTo(40, 20);
    ctx.arc(0, crankR + 25, 55, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();
    // Lobe bevel highlight
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Throw arm to rod journal
    const armGrad = ctx.createLinearGradient(-25, 0, 25, 0);
    armGrad.addColorStop(0, '#222'); armGrad.addColorStop(0.3, '#888'); armGrad.addColorStop(0.8, '#333');
    ctx.fillStyle = armGrad;
    ctx.fillRect(-25, -crankR - 20, 50, crankR + 40);
    ctx.restore();

    // ── C. Connecting Rod ──
    ctx.save();
    // Angle of the rod
    const dx = crankPinX - cx;
    const dy = crankPinY - wristPinY;
    const rodAngle = Math.atan2(dy, dx) - Math.PI/2;
    
    ctx.translate(cx, wristPinY);
    ctx.rotate(rodAngle);
    
    const rLen = Math.sqrt(dx*dx + dy*dy);
    const rodW = pistonW * 0.22;
    
    // Rod shadow
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    // Main rod body (I-Beam)
    const rodGrad = getChromeGradient(-rodW/2, 0, rodW/2, 0);
    ctx.fillStyle = rodGrad;
    ctx.beginPath();
    // Top eye (wrist pin end)
    ctx.arc(0, 0, rodW * 1.1, Math.PI, 0);
    // Tapered body
    ctx.lineTo(rodW * 1.5, rLen);
    // Bottom eye (crank pin end)
    ctx.arc(0, rLen, rodW * 1.6, 0, Math.PI);
    ctx.lineTo(-rodW * 1.1, 0);
    ctx.closePath();
    ctx.fill();
    
    // Clear shadow for inner details
    ctx.shadowColor = 'transparent';
    
    // I-Beam inner recess
    const recessGrad = ctx.createLinearGradient(-rodW/2, 0, rodW/2, 0);
    recessGrad.addColorStop(0, '#050505'); recessGrad.addColorStop(0.5, '#222'); recessGrad.addColorStop(1, '#111');
    ctx.fillStyle = recessGrad;
    ctx.beginPath();
    ctx.moveTo(-rodW*0.4, rodW*1.2);
    ctx.lineTo(rodW*0.4, rodW*1.2);
    ctx.lineTo(rodW*0.6, rLen - rodW*1.6);
    ctx.lineTo(-rodW*0.6, rLen - rodW*1.6);
    ctx.fill();
    
    // End caps and bolts on bottom journal
    ctx.fillStyle = '#000';
    ctx.fillRect(-rodW*1.8, rLen - 2, rodW*3.6, 4); // Split line
    
    // Rod bearing hole at bottom
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(0, rLen, rodW * 0.9, 0, Math.PI*2); ctx.fill();
    // Inner journal pin shining through
    const pinGrad = getChromeGradient(-rodW*0.9, 0, rodW*0.9, 0);
    ctx.fillStyle = pinGrad;
    ctx.beginPath(); ctx.arc(0, rLen, rodW * 0.7, 0, Math.PI*2); ctx.fill();

    ctx.restore();

    // ── D. PISTON ──
    
    // Oil sheen on piston skirt (if oiled)
    if (oilLevel > 0) {
      ctx.save();
      ctx.globalAlpha = oilLevel * 0.8;
      const oilSheen = ctx.createLinearGradient(px, py, px + pistonW, py);
      oilSheen.addColorStop(0, 'rgba(255, 180, 20, 0.4)');
      oilSheen.addColorStop(0.2, 'rgba(255, 220, 100, 0.8)');
      oilSheen.addColorStop(0.5, 'transparent');
      oilSheen.addColorStop(0.8, 'rgba(255, 200, 50, 0.6)');
      oilSheen.addColorStop(1, 'rgba(200, 120, 10, 0.5)');
      ctx.fillStyle = oilSheen;
      ctx.fillRect(px - 2, py, pistonW + 4, pistonH * 1.5); // Extends below skirt
      ctx.restore();
    }

    // Piston Body (Skirt)
    const pistonGrad = getChromeGradient(px, py, px + pistonW, py);
    ctx.fillStyle = pistonGrad;
    
    // Draw piston body with rounded bottom corners
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + pistonW, py);
    ctx.lineTo(px + pistonW, py + pistonH - 10);
    ctx.quadraticCurveTo(px + pistonW, py + pistonH, px + pistonW - 10, py + pistonH);
    ctx.lineTo(px + 10, py + pistonH);
    ctx.quadraticCurveTo(px, py + pistonH, px, py + pistonH - 10);
    ctx.closePath();
    ctx.fill();

    // 3D Perspective: Top Ellipse (Piston Crown)
    // To make it look 3D, we draw the top face as a squashed ellipse
    const ellipseH = pistonW * 0.15;
    const topFaceGrad = ctx.createLinearGradient(px, py - ellipseH, px, py + ellipseH);
    topFaceGrad.addColorStop(0, '#ddd');
    topFaceGrad.addColorStop(0.5, '#fff'); // Brightest at top edge
    topFaceGrad.addColorStop(1, '#888');
    ctx.fillStyle = topFaceGrad;
    ctx.beginPath();
    ctx.ellipse(cx, py, pistonW / 2, ellipseH, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Valve reliefs (little dimples on top of piston)
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.ellipse(cx - pistonW*0.25, py + ellipseH*0.2, pistonW*0.15, ellipseH*0.4, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + pistonW*0.25, py - ellipseH*0.2, pistonW*0.15, ellipseH*0.4, 0, 0, Math.PI*2); ctx.fill();

    // Piston Rings (Deep grooves with bright edges)
    const ringStartY = py + pistonH * 0.15;
    const ringSpacing = pistonH * 0.08;
    for (let r = 0; r < 3; r++) {
      const ry = ringStartY + r * ringSpacing;
      // Groove shadow (inset)
      ctx.fillStyle = '#050505';
      ctx.fillRect(px, ry, pistonW, 6);
      
      // Actual ring metal inside groove
      const ringGrad = getChromeGradient(px, 0, px + pistonW, 0);
      ctx.fillStyle = oilLevel > 0.3 ? `rgba(255, 200, 50, ${oilLevel})` : ringGrad;
      ctx.fillRect(px + 2, ry + 1, pistonW - 4, 4);
      
      // Highlight on the bottom lip of the groove
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(px, ry + 6, pistonW, 1.5);
    }

    // Wrist Pin (Gudgeon Pin) Hole
    const wpY = py + pistonH * 0.6;
    const wpR = pistonW * 0.18;
    // Outer bore
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(cx, wpY, wpR, 0, Math.PI*2); ctx.fill();
    // Inner bevel shadow
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, wpY, wpR - 2, 0, Math.PI*2); ctx.stroke();
    
    // The actual shiny pin inside
    const wpGrad = ctx.createLinearGradient(cx - wpR, wpY - wpR, cx + wpR, wpY + wpR);
    wpGrad.addColorStop(0, '#fff'); wpGrad.addColorStop(0.5, '#888'); wpGrad.addColorStop(1, '#222');
    ctx.fillStyle = wpGrad;
    ctx.beginPath(); ctx.arc(cx, wpY, wpR - 4, 0, Math.PI*2); ctx.fill();

    // ── E. Heat Spark / Combustion (Dry State) ───────────────
    // Fire flashes fiercely when piston is near top and oil is low
    if (heatAlpha > 0.1 && Math.cos(angle) > 0.9) {
      const sparkIntensity = (Math.cos(angle) - 0.9) * 10 * heatAlpha;
      ctx.globalCompositeOperation = 'screen';
      
      const fireGrad = ctx.createRadialGradient(cx, topWall - 10, 0, cx, topWall - 10, cylW * 0.8);
      fireGrad.addColorStop(0, `rgba(255, 255, 255, ${sparkIntensity})`);
      fireGrad.addColorStop(0.2, `rgba(255, 200, 50, ${sparkIntensity * 0.8})`);
      fireGrad.addColorStop(0.5, `rgba(255, 50, 0, ${sparkIntensity * 0.5})`);
      fireGrad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = fireGrad;
      ctx.fillRect(cx - cylW, topWall - cylW, cylW * 2, cylW * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  ctx.restore(); // jitter restore

  // ── OIL DRIPS (Foreground over engine) ────────────────────
  if (oilLevel > 0.05 && oilLevel < 0.8) {
    for (let i = 0; i < N; i++) {
      const cx = spacing * (i + 1);
      const dropY = H - H * 0.85 * oilLevel - 30 + Math.sin(time * 0.1 + i * 2) * 15;
      const dropSize = 8 + Math.sin(time * 0.15 + i) * 4;
      
      // Dripping teardrop shape
      ctx.save();
      ctx.translate(cx + (i%2==0?-20:20), dropY);
      
      const dg = ctx.createRadialGradient(0, 0, 0, 0, 0, dropSize);
      dg.addColorStop(0,   'rgba(255,255,200,0.9)');
      dg.addColorStop(0.3, 'rgba(220,160,20,0.9)');
      dg.addColorStop(1,   'rgba(150,80,0,0)');
      
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(0, 0, dropSize, 0, Math.PI); // Bottom half circle
      ctx.lineTo(0, -dropSize * 2.5); // Pointy top
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}


/* ── Dynamic Meter Updates ────────────────────────────────── */
const updateMeters = (p, frictionEl, heatEl, protEl) => {
  if (!frictionEl || !heatEl || !protEl) return;

  let frictionVal = 1.0, heatVal = 1.0, protVal = 0.0;
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
