/**
 * TechYodhas Standalone Particle Loader Engine
 * Can be attached to any <canvas id="particleCanvas"></canvas>
 */
class TechYodhasLoader {
  constructor(canvasId = 'particleCanvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Create initial particle pool
    for (let i = 0; i < 60; i++) {
      this.particles.push(this.createParticle());
    }

    // Interactive mouse effects
    window.addEventListener('mousemove', (e) => {
      if (Math.random() < 0.2 && this.particles.length < 100) {
        this.particles.push(this.createParticle(e.clientX, e.clientY));
        if (this.particles.length > 90) this.particles.shift();
      }
    });

    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  createParticle(x, y) {
    return {
      x: x || Math.random() * this.width,
      y: y || Math.random() * this.height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.5 ? 'rgba(56, 189, 248, ' : 'rgba(139, 92, 246, ',
      alpha: Math.random() * 0.7 + 0.3
    };
  }

  burst(cx, cy, count = 30) {
    for (let i = 0; i < count; i++) {
      const p = this.createParticle(cx, cy);
      p.vx = (Math.random() - 0.5) * 8;
      p.vy = (Math.random() - 0.5) * 8;
      this.particles.push(p);
    }
  }

  connect() {
    for (let a = 0; a < this.particles.length; a++) {
      for (let b = a + 1; b < this.particles.length; b++) {
        const dx = this.particles[a].x - this.particles[b].x;
        const dy = this.particles[a].y - this.particles[b].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(56, 189, 248, ${0.25 - dist / 480})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.moveTo(this.particles[a].x, this.particles[a].y);
          this.ctx.lineTo(this.particles[b].x, this.particles[b].y);
          this.ctx.stroke();
        }
      }
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + p.alpha + ')';
      this.ctx.fill();
    });

    this.connect();
    requestAnimationFrame(() => this.animate());
  }
}

// Auto-initialize if canvas exists
document.addEventListener('DOMContentLoaded', () => {
  window.techYodhasLoader = new TechYodhasLoader();
});
