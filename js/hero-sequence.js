export class HeroSequence {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Config
    this.sequences = [
      { id: 'hood', dir: 'assets/frames/hood', prefix: 'ezgif-frame-', count: 250 },
      { id: 'oil', dir: 'assets/frames/oil', prefix: 'ezgif-frame-', count: 100 },
      { id: 'rpm', dir: 'assets/frames/rpm', prefix: 'ezgif-frame-', count: 125 }
    ];
    
    this.totalFrames = this.sequences.reduce((acc, seq) => acc + seq.count, 0);
    this.allFrames = new Array(this.totalFrames);
    this.currentFrame = 0;
    
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  resize() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.render(this.currentFrame);
  }

  async load() {
    let globalIndex = 0;
    for (const seq of this.sequences) {
      for (let i = 1; i <= seq.count; i++) {
        const numStr = i.toString().padStart(3, '0');
        const src = `${seq.dir}/${seq.prefix}${numStr}.jpg`;
        const img = new Image();
        img.src = src;
        this.allFrames[globalIndex++] = img;
      }
    }

    // Await first frame
    if (this.allFrames[0]) {
      await new Promise(resolve => {
        if (this.allFrames[0].complete) resolve();
        else {
          this.allFrames[0].onload = resolve;
          this.allFrames[0].onerror = resolve; // Prevent hanging on 404
        }
      });
      this.render(0);
    }
  }

  render(globalFrameIndex) {
    if (!this.canvas) return;
    this.currentFrame = Math.floor(Math.max(0, Math.min(globalFrameIndex, this.totalFrames - 1)));
    const img = this.allFrames[this.currentFrame];
    
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Object-fit: cover logic
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;
    
    let drawW = cw;
    let drawH = ch;
    let drawX = 0;
    let drawY = 0;
    
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
