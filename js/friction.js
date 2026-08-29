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
   ENGINE DRAWING
   ─────────────────────────────────────────────────────────── */
function drawEngine(ctx, W, H, state) {
  const { crankAngle, oilLevel, heatAlpha, jitter, time } = state;

  // Engine layout constants
  const N = 4;                         // cylinders
  const crankR  = H * 0.08;           // crank throw radius
  const rodLen  = H * 0.22;           // connecting rod length
  const pistonW = W / 9;
  const pistonH = pistonW * 0.55;
  const cylW    = pistonW + 14;
  const cylH    = H * 0.42;
  const spacing = W / (N + 1);
  const crankY  = H * 0.72;           // crankshaft Y centre
  const topWall = H * 0.08;           // top of cylinders

  // Fire order offsets: 1-3-4-2 → 0°, 180°, 270°, 90°
  const fireOffsets = [0, Math.PI, Math.PI * 1.5, Math.PI * 0.5];

  // ── OIL FLOOD from bottom ─────────────────────────────────
  if (oilLevel > 0) {
    const oilTop = H - (H * 0.85 * oilLevel);
    const oilGrad = ctx.createLinearGradient(0, oilTop, 0, H);
    oilGrad.addColorStop(0,   `rgba(220,160,20,${Math.min(oilLevel, 0.95)})`);
    oilGrad.addColorStop(0.3, `rgba(180,120,10,${Math.min(oilLevel, 0.9)})`);
    oilGrad.addColorStop(1,   `rgba(120, 80, 5,${Math.min(oilLevel, 0.95)})`);
    ctx.fillStyle = oilGrad;
    ctx.fillRect(0, oilTop, W, H - oilTop);

    // Oil surface wave
    if (oilLevel > 0.05) {
      ctx.beginPath();
      ctx.moveTo(0, oilTop);
      for (let x = 0; x <= W; x += 8) {
        const waveY = oilTop + Math.sin((x / W) * Math.PI * 6 + time * 0.12) * 4 * oilLevel;
        ctx.lineTo(x, waveY);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = `rgba(255,200,60,${oilLevel * 0.3})`;
      ctx.fill();

      // Shimmer line on surface
      ctx.beginPath();
      ctx.moveTo(0, oilTop);
      for (let x = 0; x <= W; x += 8) {
        const waveY = oilTop + Math.sin((x / W) * Math.PI * 6 + time * 0.12) * 4 * oilLevel;
        ctx.lineTo(x, waveY);
      }
      ctx.strokeStyle = `rgba(255,240,160,${oilLevel * 0.7})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // ── HEAT SHIMMER BACKGROUND (dry state) ───────────────────
  if (heatAlpha > 0) {
    const hg = ctx.createRadialGradient(W/2, H*0.6, 0, W/2, H*0.6, W*0.6);
    hg.addColorStop(0,   `rgba(200,40,0,${0.25 * heatAlpha})`);
    hg.addColorStop(0.5, `rgba(160,18,30,${0.15 * heatAlpha})`);
    hg.addColorStop(1,   'transparent');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, W, H);
  }

  // ── CRANKSHAFT ────────────────────────────────────────────
  const jx = jitter > 0 ? (Math.random() - 0.5) * jitter : 0;
  const jy = jitter > 0 ? (Math.random() - 0.5) * jitter : 0;

  // Main crank shaft bar
  ctx.save();
  ctx.translate(jx, jy);

  // Crankshaft body
  const shaftGrad = ctx.createLinearGradient(spacing * 0.3, crankY - 12, spacing * 0.3, crankY + 12);
  shaftGrad.addColorStop(0,   '#666');
  shaftGrad.addColorStop(0.3, '#aaa');
  shaftGrad.addColorStop(0.7, '#888');
  shaftGrad.addColorStop(1,   '#333');
  ctx.fillStyle = shaftGrad;
  ctx.beginPath();
  ctx.roundRect(spacing * 0.3, crankY - 12, spacing * (N + 0.4), 24, 8);
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Each cylinder ─────────────────────────────────────────
  for (let i = 0; i < N; i++) {
    const cx = spacing * (i + 1);  // cylinder X centre

    // Crank pin position for this cylinder
    const angle = crankAngle + fireOffsets[i];
    const crankPinX = cx + crankR * Math.sin(angle);
    const crankPinY = crankY - crankR * Math.cos(angle);

    // Piston Y from slider-crank geometry
    const ratio = crankR / rodLen;
    const pistonY = crankY - crankR * Math.cos(angle)
                  - rodLen * Math.sqrt(1 - Math.pow(ratio * Math.sin(angle), 2));

    // ── Cylinder walls ───────────────────────────────────────
    const wallX = cx - cylW / 2;
    const wallGrad = ctx.createLinearGradient(wallX, 0, wallX + cylW, 0);
    wallGrad.addColorStop(0,    '#1a1a1a');
    wallGrad.addColorStop(0.08, '#3a3a3a');
    wallGrad.addColorStop(0.15, '#555');
    wallGrad.addColorStop(0.5,  '#2a2a2a');
    wallGrad.addColorStop(0.85, '#555');
    wallGrad.addColorStop(0.92, '#3a3a3a');
    wallGrad.addColorStop(1,    '#1a1a1a');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(wallX, topWall, cylW, cylH);

    // Wall inner shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(wallX, topWall, 5, cylH);
    ctx.fillRect(wallX + cylW - 5, topWall, 5, cylH);

    // Cylinder top (head)
    const headGrad = ctx.createLinearGradient(wallX, topWall - 20, wallX, topWall);
    headGrad.addColorStop(0, '#444');
    headGrad.addColorStop(0.5, '#6a6a6a');
    headGrad.addColorStop(1, '#3a3a3a');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.roundRect(wallX - 8, topWall - 22, cylW + 16, 22, [6, 6, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Heat spark at TDC (dry only) ─────────────────────────
    if (heatAlpha > 0.3 && Math.cos(angle) > 0.85) {
      const sparkAlpha = (Math.cos(angle) - 0.85) / 0.15 * heatAlpha;
      const sg = ctx.createRadialGradient(cx, topWall + 10, 0, cx, topWall + 10, 30);
      sg.addColorStop(0,   `rgba(255,200,50,${sparkAlpha * 0.9})`);
      sg.addColorStop(0.4, `rgba(255,80,0,${sparkAlpha * 0.5})`);
      sg.addColorStop(1,   'transparent');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(cx, topWall + 10, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Connecting Rod ───────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = '#777';
    ctx.lineWidth = pistonW * 0.16;
    ctx.lineCap = 'round';

    // Rod shadow
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.moveTo(crankPinX, crankPinY);
    ctx.lineTo(cx, pistonY + pistonH * 0.5);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Rod highlight
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = pistonW * 0.07;
    ctx.beginPath();
    ctx.moveTo(crankPinX + 2, crankPinY + 2);
    ctx.lineTo(cx + 2, pistonY + pistonH * 0.5 + 2);
    ctx.stroke();
    ctx.restore();

    // ── Piston body ──────────────────────────────────────────
    const px = cx - pistonW / 2;
    const py = pistonY;

    // Oil sheen on piston in oiled state
    if (oilLevel > 0) {
      ctx.save();
      ctx.globalAlpha = oilLevel * 0.5;
      ctx.fillStyle = `rgba(200,140,10,0.3)`;
      ctx.fillRect(px, py, pistonW, pistonH * 1.5);
      ctx.restore();
    }

    // Piston gradient — steel
    const pg = ctx.createLinearGradient(px, py, px + pistonW, py);
    pg.addColorStop(0,    '#222');
    pg.addColorStop(0.1,  '#555');
    pg.addColorStop(0.25, '#ccc');
    pg.addColorStop(0.5,  '#e0e0e0');
    pg.addColorStop(0.75, '#aaa');
    pg.addColorStop(0.9,  '#555');
    pg.addColorStop(1,    '#222');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.roundRect(px, py, pistonW, pistonH, 5);
    ctx.fill();

    // Piston top face — brighter
    const ptg = ctx.createLinearGradient(px, py, px, py + pistonH * 0.25);
    ptg.addColorStop(0,   '#ddd');
    ptg.addColorStop(1,   '#999');
    ctx.fillStyle = ptg;
    ctx.beginPath();
    ctx.roundRect(px + 4, py, pistonW - 8, pistonH * 0.22, [5, 5, 0, 0]);
    ctx.fill();

    // Piston rings
    for (let r = 0; r < 3; r++) {
      const ry = py + pistonH * (0.3 + r * 0.22);
      ctx.strokeStyle = oilLevel > 0.3
        ? `rgba(200,150,20,${0.6 + oilLevel * 0.3})`
        : '#666';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, ry);
      ctx.lineTo(px + pistonW, ry);
      ctx.stroke();
      // Ring highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, ry - 1);
      ctx.lineTo(px + pistonW, ry - 1);
      ctx.stroke();
    }

    // ── Crank journal disc ───────────────────────────────────
    const cjg = ctx.createRadialGradient(crankPinX, crankPinY, 2, crankPinX, crankPinY, crankR * 0.55);
    cjg.addColorStop(0,   '#888');
    cjg.addColorStop(0.5, '#555');
    cjg.addColorStop(1,   '#2a2a2a');
    ctx.fillStyle = cjg;
    ctx.beginPath();
    ctx.arc(crankPinX, crankPinY, crankR * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Journal pin
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.arc(crankPinX, crankPinY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main crankshaft journals at cylinder centres
  for (let i = 0; i < N; i++) {
    const cx = spacing * (i + 1);
    const mg = ctx.createRadialGradient(cx, crankY, 2, cx, crankY, 18);
    mg.addColorStop(0,   '#aaa');
    mg.addColorStop(0.5, '#666');
    mg.addColorStop(1,   '#333');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(cx, crankY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore(); // jitter restore

  // ── OIL drips entry (mid-transition) ─────────────────────
  if (oilLevel > 0.05 && oilLevel < 0.8) {
    for (let i = 0; i < N; i++) {
      const cx = spacing * (i + 1);
      const dropY = H - H * 0.85 * oilLevel - 20 + Math.sin(time * 0.05 + i) * 8;
      const dropSize = 6 + Math.sin(time * 0.08 + i * 1.2) * 3;
      const dg = ctx.createRadialGradient(cx, dropY, 0, cx, dropY, dropSize);
      dg.addColorStop(0,   'rgba(255,220,80,0.9)');
      dg.addColorStop(0.5, 'rgba(200,140,10,0.8)');
      dg.addColorStop(1,   'rgba(150,90,0,0)');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(cx, dropY, dropSize, 0, Math.PI * 2);
      ctx.fill();
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
