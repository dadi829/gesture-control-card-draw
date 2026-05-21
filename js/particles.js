/**
 * 粒子背景系统 — Canvas 星光粒子特效
 */

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) { console.warn('ParticleSystem: Canvas element not found!'); return; }
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.particles = [];
    this.stars = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.prevMouseX = -999;
    this.prevMouseY = -999;
    this.isRunning = false;
    this.rafId = null;
    this.frameSkip = 0;
    this.isDirty = true;
    this.needsFullRedraw = true;
    this.config = {
      starCount: 100,
      particleCount: 0,
      starColors: ['#ffffff', '#ffe9c4', '#c9a84c', '#e8d5a3', '#fff8dc'],
      sparkColors: ['#c9a84c', '#f5d78c', '#ffffff'],
      minStarSize: 0.5,
      maxStarSize: 2.5,
      sparkLife: 80,
      gravity: 0.03
    };
    this.resize();
    this.bindEvents();
    this.createStars();
    this._initGradients();
    this.start();
  }

  resize() {
    if (!this.canvas) return;
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.needsFullRedraw = true;
  }

  _initGradients() {
    this._bgGrad = null;
    this._glowGrads = new Map();
    this._updateBgGradient();
  }

  _updateBgGradient() {
    if (this._bgGrad) return;
    this._bgGrad = this.ctx.createRadialGradient(this.width / 2, this.height * 0.3, 0, this.width / 2, this.height * 0.3, this.width * 0.8);
    this._bgGrad.addColorStop(0, 'rgba(20, 10, 60, 0.3)');
    this._bgGrad.addColorStop(0.5, 'rgba(10, 5, 30, 0.1)');
    this._bgGrad.addColorStop(1, 'rgba(5, 2, 15, 0)');
  }

  bindEvents() {
    if (!this.canvas) return;
    window.addEventListener('resize', () => { this._bgGrad = null; this.resize(); });
    document.addEventListener('mousemove', (e) => { this.mouseX = e.clientX; this.mouseY = e.clientY; this.isDirty = true; });
    document.addEventListener('touchmove', (e) => { if (e.touches && e.touches[0]) { this.mouseX = e.touches[0].clientX; this.mouseY = e.touches[0].clientY; this.isDirty = true; } }, { passive: true });
    document.addEventListener('click', (e) => { this.burst(e.clientX, e.clientY, 8); });
    document.addEventListener('touchend', (e) => { if (e.changedTouches && e.changedTouches[0]) { const touch = e.changedTouches[0]; this.burst(touch.clientX, touch.clientY, 8); } });
  }

  createStars() {
    if (!this.canvas) return;
    for (let i = 0; i < this.config.starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: this.config.minStarSize + Math.random() * (this.config.maxStarSize - this.config.minStarSize),
        opacity: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.005 + Math.random() * 0.02,
        twinkleOffset: Math.random() * Math.PI * 2,
        color: this.config.starColors[Math.floor(Math.random() * this.config.starColors.length)]
      });
    }
  }

  burst(x, y, count) {
    if (!this.canvas) return;
    this.isDirty = true;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 2,
        opacity: 1,
        life: this.config.sparkLife,
        decay: 0.02 + Math.random() * 0.03,
        color: this.config.sparkColors[Math.floor(Math.random() * this.config.sparkColors.length)]
      });
    }
  }

  update() {
    if (!this.canvas) return;
    const time = Date.now() * 0.001;
    const hasParticles = this.particles.length > 0;
    const mouseMoved = this.mouseX !== this.prevMouseX || this.mouseY !== this.prevMouseY;
    if (!hasParticles && !mouseMoved && !this.needsFullRedraw) { this.isDirty = false; return; }
    this.prevMouseX = this.mouseX;
    this.prevMouseY = this.mouseY;
    this.isDirty = true;
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      star.currentOpacity = star.opacity * (0.5 + 0.5 * Math.sin(time * star.twinkleSpeed * 60 + star.twinkleOffset));
      const dx = star.x - this.mouseX;
      const dy = star.y - this.mouseY;
      if (dx * dx + dy * dy < 22500) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        star.currentOpacity = Math.min(1, star.currentOpacity + 0.3 * (1 - dist / 150));
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += this.config.gravity;
      p.opacity -= p.decay;
      p.life--;
      if (p.life <= 0 || p.opacity <= 0) this.particles.splice(i, 1);
    }
    this.needsFullRedraw = false;
  }

  draw() {
    if (!this.canvas || !this.ctx || !this.isDirty) return;
    this.ctx.fillStyle = '#050510';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this._updateBgGradient();
    if (this._bgGrad) { this.ctx.fillStyle = this._bgGrad; this.ctx.fillRect(0, 0, this.width, this.height); }
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      const opacity = star.currentOpacity || star.opacity;
      if (opacity < 0.02) continue;
      this.ctx.globalAlpha = opacity;
      this.ctx.beginPath();
      this.ctx.arc(star.x | 0, star.y | 0, star.size, 0, Math.PI * 2);
      this.ctx.fillStyle = star.color;
      this.ctx.fill();
      if (star.size > 1.5 && opacity > 0.55) {
        const glow = this.ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 2.5);
        glow.addColorStop(0, star.color);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = glow;
        this.ctx.globalAlpha = opacity * 0.3;
        this.ctx.fill();
      }
    }
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.ctx.globalAlpha = p.opacity;
      this.ctx.beginPath();
      this.ctx.arc(p.x | 0, p.y | 0, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
      const glow = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      glow.addColorStop(0, p.color);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      this.ctx.fillStyle = glow;
      this.ctx.globalAlpha = p.opacity * 0.4;
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
    this.isDirty = this.particles.length > 0;
  }

  animate() {
    if (!this.canvas || !this.isRunning) return;
    this.update();
    this.draw();
    this.rafId = requestAnimationFrame(() => this.animate());
  }

  start() {
    if (!this.canvas || this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }
}

window.ParticleSystem = ParticleSystem;
