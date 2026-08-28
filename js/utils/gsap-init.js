/* ============================================================
   MILEAGE MASTER — GSAP INITIALIZATION
   Power Under The Hood | gsap-init.js
   ============================================================ */

/**
 * Configures GSAP with all required plugins.
 * Called once at app init before any animation modules run.
 */
export const initGSAP = () => {
  if (!window.gsap) {
    console.warn('[GSAP] Not loaded. Check CDN link.');
    return false;
  }

  const { gsap, ScrollTrigger, SplitText } = window;

  // Register plugins
  const plugins = [ScrollTrigger];
  if (SplitText) plugins.push(SplitText);
  gsap.registerPlugin(...plugins);

  // Global GSAP defaults
  gsap.defaults({
    ease: 'power3.out',
    duration: 0.8,
  });

  // ScrollTrigger defaults
  ScrollTrigger.defaults({
    toggleActions: 'play none none reverse',
  });

  // Performance: anticipate pin
  ScrollTrigger.config({
    autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load,resize',
    limitCallbacks: true,
  });

  // Refresh ScrollTrigger on font load to avoid layout shifts
  document.fonts.ready.then(() => ScrollTrigger.refresh());

  return { gsap, ScrollTrigger, SplitText };
};

/**
 * Split text into chars/words/lines for kinetic typography.
 * Falls back to simple opacity animation if SplitText unavailable.
 */
export const splitText = (element, type = 'chars,words') => {
  if (!window.SplitText) {
    // Manual fallback: wrap each word
    const text = element.textContent;
    element.innerHTML = text.split(' ').map(
      w => `<span class="split-word" style="display:inline-block;overflow:hidden">
              <span class="split-inner" style="display:inline-block">${w}</span>
            </span>`
    ).join(' ');
    return {
      chars: element.querySelectorAll('.split-inner'),
      words: element.querySelectorAll('.split-word'),
      lines: [element],
    };
  }

  const split = new window.SplitText(element, {
    type,
    charsClass:  'char',
    wordsClass:  'word',
    linesClass:  'line',
  });

  // Wrap lines for overflow clipping
  if (split.lines) {
    split.lines.forEach(line => {
      line.style.overflow = 'hidden';
      line.style.display  = 'block';
    });
  }

  return split;
};
