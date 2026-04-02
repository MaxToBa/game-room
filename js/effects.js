/**
 * effects.js — Visual effects for GameRoom
 * Usage:
 *   <script src="../js/effects.js"></script>
 *   GameEffects.confetti()        // win celebration
 *   GameEffects.shake(element)    // lose shake
 *   GameEffects.particles(x, y)   // burst at coordinates
 *   GameEffects.floatText('+100', element) // floating score text
 */
const GameEffects = (() => {
  // ── Canvas confetti ─────────────────────────────────────────────────────────
  function confetti(opts = {}) {
    const count = opts.count || 120;
    const duration = opts.duration || 3000;
    const colors = opts.colors || [
      '#e8c547','#7c6af5','#4fcf8e','#f05a5a','#60c8f0','#ff8c42','#c56cff'
    ];

    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position: fixed; inset: 0; pointer-events: none; z-index: 9998;
      width: 100vw; height: 100vh;
    `;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const pieces = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height * 0.3 - 10,
      r: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      vrot: (Math.random() - 0.5) * 0.2,
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
      w: Math.random() * 10 + 6,
      h: Math.random() * 6 + 4,
      opacity: 1,
    }));

    const startTime = performance.now();

    function draw(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.vy += 0.1; // gravity
        // Fade out in last 20%
        p.opacity = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (progress < 1) {
        requestAnimationFrame(draw);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(draw);
  }

  // ── Shake animation ──────────────────────────────────────────────────────────
  function shake(el) {
    if (!el) return;
    // Remove first in case already shaking
    el.style.animation = '';
    requestAnimationFrame(() => {
      el.style.animation = 'gfxShake 0.5s cubic-bezier(0.36,0.07,0.19,0.97) both';
      el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
    });

    if (!document.getElementById('gfxShakeStyle')) {
      const s = document.createElement('style');
      s.id = 'gfxShakeStyle';
      s.textContent = `
        @keyframes gfxShake {
          10%, 90%  { transform: translateX(-2px); }
          20%, 80%  { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60%  { transform: translateX(6px); }
          100%      { transform: translateX(0); }
        }
      `;
      document.head.appendChild(s);
    }
  }

  // ── Particle burst ────────────────────────────────────────────────────────────
  function particles(x, y, opts = {}) {
    const count = opts.count || 16;
    const colors = opts.colors || ['#e8c547','#7c6af5','#4fcf8e','#f05a5a'];
    const duration = opts.duration || 600;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position: fixed; inset: 0; pointer-events: none; z-index: 9997;
      width: 100vw; height: 100vh;
    `;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const parts = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = Math.random() * 5 + 3;
      return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
      };
    });

    const startTime = performance.now();

    function draw(now) {
      const t = Math.min((now - startTime) / duration, 1);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.vx *= 0.95;
        p.opacity = 1 - t;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (t < 1) requestAnimationFrame(draw);
      else canvas.remove();
    }

    requestAnimationFrame(draw);
  }

  // ── Floating text (+100, WIN!, etc.) ─────────────────────────────────────────
  function floatText(text, el, opts = {}) {
    const color = opts.color || '#e8c547';
    const div = document.createElement('div');
    div.textContent = text;
    div.style.cssText = `
      position: fixed; pointer-events: none; z-index: 9996;
      font-family: 'DM Serif Display', serif; font-size: ${opts.size || 22}px;
      font-weight: 700; color: ${color}; white-space: nowrap;
      text-shadow: 0 2px 8px rgba(0,0,0,0.5);
      animation: gfxFloat 1.2s ease forwards;
    `;

    if (!document.getElementById('gfxFloatStyle')) {
      const s = document.createElement('style');
      s.id = 'gfxFloatStyle';
      s.textContent = `
        @keyframes gfxFloat {
          0%   { opacity: 0; transform: translateY(0) scale(0.8); }
          20%  { opacity: 1; transform: translateY(-10px) scale(1.1); }
          80%  { opacity: 1; transform: translateY(-50px) scale(1); }
          100% { opacity: 0; transform: translateY(-70px) scale(0.9); }
        }
      `;
      document.head.appendChild(s);
    }

    if (el) {
      const rect = el.getBoundingClientRect();
      div.style.left = (rect.left + rect.width / 2 - 30) + 'px';
      div.style.top = (rect.top - 10) + 'px';
    } else {
      div.style.left = '50%';
      div.style.top = '40%';
      div.style.transform = 'translateX(-50%)';
    }

    document.body.appendChild(div);
    div.addEventListener('animationend', () => div.remove());
  }

  // ── Glow pulse (e.g. on win cell) ────────────────────────────────────────────
  function glowPulse(el, color = '#7c6af5') {
    if (!el) return;
    const orig = el.style.boxShadow;
    let n = 0;
    const interval = setInterval(() => {
      el.style.boxShadow = n % 2 === 0
        ? `0 0 20px ${color}, 0 0 40px ${color}`
        : orig;
      n++;
      if (n > 5) { clearInterval(interval); el.style.boxShadow = orig; }
    }, 200);
  }

  return { confetti, shake, particles, floatText, glowPulse };
})();
