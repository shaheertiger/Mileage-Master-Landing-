/* ============================================================
   MILEAGE MASTER — CANVAS PARTICLE SYSTEM
   Oil droplet particles for hero scene | particles.js
   ============================================================ */

import { TIER } from './utils/device.js';

let canvas, ctx, particles = [], raf, running = false;

/** Config per device tier */
const CONFIG = {
  high:   { count: 120, speed: 0.4, size: [1, 4], opacity: [0.2, 0.7] },
  medium: { count: 60,  speed: 0.3, size: [1, 3], opacity: [0.15, 0.5] },
  low:    { count: 0,   speed: 0,   size: [1, 2], opacity: [0.1, 0.3] },
  minimal:{ count: 0,   speed: 0,   size: [1, 2], opacity: [0, 0] },
};

const COLORS = [
  'rgba(200, 134,  10, α)',  // oil-amber
  'rgba(240, 180,  41, α)',  // oil-gold
  'rgba(255, 213, 102, α)',  // oil-light
  'rgba(196,  18,  48, α)',  // brand-red
];

class Particle {
  constructor(w, h, cfg) {
    this.reset(w, h, cfg);
  }

  reset(w, h, cfg) {
    this.x    = Math.random() * w;
    this.y    = Math.random() * h + h; // Start below viewport
    this.vx   = (Math.random() - 0.5) * cfg.speed;
    this.vy   = -(cfg.speed + Math.random() * cfg.speed * 1.5);
    this.r    = cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]);
    this.maxO = cfg.opacity[0] + Math.random() * (cfg.opacity[1] - cfg.opacity[0]);
    this.o    = 0;
    this.life = 0;
    this.maxLife = 120 + Math.random() * 180;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.02 + Math.random() * 0.03;
  }

  update(w, h, cfg) {
    this.life++;
    this.wobble += this.wobbleSpeed;
    this.x += this.vx + Math.sin(this.wobble) * 0.3;
    this.y += this.vy;

    // Fade in / fade out
    const progress = this.life / this.maxLife;
    if (progress < 0.15) {
      this.o = (progress / 0.15) * this.maxO;
    } else if (progress > 0.75) {
      this.o = ((1 - progress) / 0.25) * this.maxO;
    } else {
      this.o = this.maxO;
    }

    if (this.life >= this.maxLife || this.y < -20) {
      this.reset(w, h, cfg);
    }
  }

  draw(ctx) {
    const color = this.color.replace('α', this.o.toFixed(3));
    ctx.save();
    ctx.beginPath();
    // Teardrop shape for oil drops
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = this.color.replace('α', '0.4');
    ctx.shadowBlur  = this.r * 3;
    ctx.fill();
    ctx.restore();
  }
}

export const initParticles = (canvasEl) => {
  if (TIER === 'minimal' || TIER === 'low') return;

  canvas = canvasEl;
  if (!canvas) return;

  ctx = canvas.getContext('2d');
  const cfg = CONFIG[TIER] || CONFIG.medium;
  if (cfg.count === 0) return;

  resize();
  window.addEventListener('resize', resize, { passive: true });

  const w = canvas.width, h = canvas.height;

  // Stagger particle creation
  for (let i = 0; i < cfg.count; i++) {
    const p = new Particle(w, h, cfg);
    p.life = Math.floor(Math.random() * p.maxLife); // Random phase
    p.y = Math.random() * h; // Spread across viewport initially
    particles.push(p);
  }

  running = true;
  loop();
};

const loop = () => {
  if (!running) return;
  raf = requestAnimationFrame(loop);
  const w = canvas.width, h = canvas.height;
  const cfg = CONFIG[TIER] || CONFIG.medium;

  ctx.clearRect(0, 0, w, h);

  for (const p of particles) {
    p.update(w, h, cfg);
    p.draw(ctx);
  }
};

export const setParticleOpacity = (opacity) => {
  if (canvas) canvas.style.opacity = opacity;
};

export const destroyParticles = () => {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  particles = [];
  window.removeEventListener('resize', resize);
};

const resize = () => {
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
};
