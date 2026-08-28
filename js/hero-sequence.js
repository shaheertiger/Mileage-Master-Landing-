export class HeroSequence {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { alpha: false, willReadFrequently: false });
    
    // Config
    this.sequences = [
      { id: 'hood', dir: 'assets/frames/hood', prefix: 'ezgif-frame-', count: 250 },
      { id: 'oil',  dir: 'assets/frames/oil',  prefix: 'ezgif-frame-', count: 100 },
      { id: 'rpm',  dir: 'assets/frames/rpm',  prefix: 'ezgif-frame-', count: 125 }
    ];
    
    this.totalFrames = this.sequences.reduce((acc, seq) => acc + seq.count, 0);
    this.allFrames = new Array(this.totalFrames).fill(null);
    this.currentFrame = 0;
    this._rafId = null;
    this._pendingFrame = null;

    // CSS: promote canvas to own GPU layer
    this.canvas.style.willChange = 'contents';
    this.canvas.style.transform = 'translateZ(0)';
    
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  resize() {
    if (!this.canvas) return;
    // Clamp DPR to 2 — no visual benefit beyond 2x and saves huge GPU memory
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width  = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    // CSS size stays viewport size
    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = h + 'px';
    this._dpr = dpr;
    this._drawNow(this.currentFrame);
  }

  async load() {
    // Build all image objects immediately
    let globalIndex = 0;
    for (const seq of this.sequences) {
      for (let i = 1; i <= seq.count; i++) {
        const numStr = i.toString().padStart(3, '0');
        const src = `${seq.dir}/${seq.prefix}${numStr}.jpg`;
        const img = new Image();
        img.decoding = 'async'; // Non-blocking decode
        img.src = src;
        this.allFrames[globalIndex++] = img;
      }
    }

    // Eagerly await first frame to avoid initial blank screen
    if (this.allFrames[0]) {
      await new Promise(resolve => {
        if (this.allFrames[0].complete && this.allFrames[0].naturalWidth > 0) return resolve();
        this.allFrames[0].onload  = resolve;
        this.allFrames[0].onerror = resolve;
      });
      this._drawNow(0);
    }
  }

  // Called by GSAP scrubber - schedules RAF to avoid mid-frame paints
  render(globalFrameIndex) {
    this._pendingFrame = Math.floor(Math.max(0, Math.min(globalFrameIndex, this.totalFrames - 1)));
    if (this._rafId) return; // Already a frame scheduled
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      if (this._pendingFrame !== null) {
        this._drawNow(this._pendingFrame);
        this._pendingFrame = null;
      }
    });
  }

  // Immediate draw (used by resize & first frame)
  _drawNow(globalFrameIndex) {
    if (!this.canvas) return;
    this.currentFrame = Math.floor(Math.max(0, Math.min(globalFrameIndex, this.totalFrames - 1)));
    const img = this.allFrames[this.currentFrame];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Object-fit: cover
    const imgRatio    = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;
    let drawW = cw, drawH = ch, drawX = 0, drawY = 0;
    if (imgRatio > canvasRatio) {
      drawW = ch * imgRatio;
      drawX = (cw - drawW) / 2;
    } else {
      drawH = cw / imgRatio;
      drawY = (ch - drawH) / 2;
    }
    
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }
}
