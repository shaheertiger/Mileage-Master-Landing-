/* ============================================================
   MILEAGE MASTER — DEVICE CAPABILITY DETECTION
   Power Under The Hood | device.js
   ============================================================ */

/**
 * Detects device capability and returns a tier:
 * 'high'    → Full WebGL + particles + all animations
 * 'medium'  → CSS animations + canvas particles, no heavy WebGL
 * 'low'     → CSS transitions only, static fallback
 * 'minimal' → prefers-reduced-motion, crossfades only
 */
export const detectDeviceTier = () => {
  // Prefers reduced motion takes highest priority
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'minimal';
  }

  // Mobile check — bump down one tier
  const isMobile = window.innerWidth < 768
    || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const memory = navigator.deviceMemory || 4;   // GB
  const cores  = navigator.hardwareConcurrency || 4;

  // WebGL capability check
  let webglSupported = false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    webglSupported = !!gl;
    if (gl) gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch (_) {
    webglSupported = false;
  }

  // Tier assignment
  if (!webglSupported || memory <= 1 || cores <= 2) return 'low';

  if (isMobile) {
    return memory >= 4 && cores >= 6 ? 'medium' : 'low';
  }

  if (memory >= 8 && cores >= 8) return 'high';
  if (memory >= 4 && cores >= 4) return 'medium';
  return 'low';
};

/**
 * Apply device tier to <html> as a data attribute
 * so CSS can respond: [data-tier="low"] .heavy-fx { display: none }
 */
export const applyDeviceTier = (tier) => {
  document.documentElement.dataset.tier = tier;
  return tier;
};

export const TIER = (() => {
  const t = detectDeviceTier();
  return applyDeviceTier(t);
})();
