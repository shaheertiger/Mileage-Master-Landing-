/* ============================================================
   MILEAGE MASTER — GLOBAL EVENT BUS
   Power Under The Hood | events.js
   ============================================================ */

/**
 * Lightweight pub/sub event bus for cross-module communication.
 * Modules subscribe to named events and emit data to each other
 * without direct coupling.
 *
 * Usage:
 *   import { on, emit, off } from './events.js';
 *   on('hero:stage-change', ({ stage }) => { ... });
 *   emit('hero:stage-change', { stage: 2 });
 */

const listeners = new Map();

export const on = (event, callback) => {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(callback);
  // Return cleanup function
  return () => off(event, callback);
};

export const off = (event, callback) => {
  listeners.get(event)?.delete(callback);
};

export const emit = (event, data) => {
  listeners.get(event)?.forEach(cb => {
    try {
      cb(data);
    } catch (err) {
      console.error(`[EventBus] Error in handler for "${event}":`, err);
    }
  });
};

export const once = (event, callback) => {
  const wrapped = (data) => {
    callback(data);
    off(event, wrapped);
  };
  on(event, wrapped);
};

// System events
export const EVENTS = {
  LOADER_COMPLETE:     'loader:complete',
  LOADER_PROGRESS:     'loader:progress',
  NAV_OPEN:            'nav:open',
  NAV_CLOSE:           'nav:close',
  HERO_STAGE_CHANGE:   'hero:stage-change',
  HERO_SCROLL_PROGRESS:'hero:scroll-progress',
  WEBGL_READY:         'webgl:ready',
  WEBGL_ERROR:         'webgl:error',
  PARTICLES_READY:     'particles:ready',
  RESIZE:              'app:resize',
};
