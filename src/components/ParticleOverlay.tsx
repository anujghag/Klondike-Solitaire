import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'circle' | 'diamond' | 'star';
}

export interface ParticleOverlayHandle {
  emit: (x: number, y: number, themeId: string) => void;
}

// ─── Theme-specific particle configs ──────────────────────────────────────────

const THEME_PARTICLES: Record<string, { colors: string[]; shape: Particle['shape'] }> = {
  'mystic-void': {
    colors: ['rgba(212,212,216,0.9)', 'rgba(161,161,170,0.8)', 'rgba(228,228,231,0.7)', 'rgba(113,113,122,0.6)'],
    shape: 'star',
  },
  'classic-luxury': {
    colors: ['rgba(245,158,11,0.9)', 'rgba(217,119,6,0.8)', 'rgba(251,191,36,0.7)', 'rgba(180,83,9,0.6)'],
    shape: 'diamond',
  },
  'ethereal-light': {
    colors: ['rgba(196,181,253,0.9)', 'rgba(251,146,60,0.7)', 'rgba(253,186,116,0.8)', 'rgba(167,139,250,0.6)'],
    shape: 'circle',
  },
  'maratha-glory': {
    colors: ['rgba(239,68,68,0.9)', 'rgba(245,158,11,0.8)', 'rgba(251,146,60,0.7)', 'rgba(220,38,38,0.6)'],
    shape: 'diamond',
  },
};

const DEFAULT_PARTICLES = {
  colors: ['rgba(255,255,255,0.8)', 'rgba(200,200,200,0.6)'],
  shape: 'circle' as Particle['shape'],
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ParticleOverlay = forwardRef<ParticleOverlayHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const isRunningRef = useRef(false);

  const startLoop = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) { isRunningRef.current = false; return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { isRunningRef.current = false; return; }

      // Match canvas size to viewport
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const gravity = 120; // px/s²
      const dt = 1 / 60;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Physics
        p.vy += gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Alpha fade
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'diamond') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        } else if (p.shape === 'star') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2;
            const r = j === 0 ? p.size : p.size;
            if (j === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      if (particles.length > 0) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        isRunningRef.current = false;
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, []);

  const emit = useCallback((x: number, y: number, themeId: string) => {
    const config = THEME_PARTICLES[themeId] || DEFAULT_PARTICLES;
    const count = 10 + Math.floor(Math.random() * 4); // 10-13 particles

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const speed = 80 + Math.random() * 160;
      const life = 0.3 + Math.random() * 0.3;

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60, // bias upward
        life,
        maxLife: life,
        size: 2 + Math.random() * 3,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        shape: config.shape,
      });
    }

    startLoop();
  }, [startLoop]);

  useImperativeHandle(ref, () => ({ emit }), [emit]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9998 }}
    />
  );
});

ParticleOverlay.displayName = 'ParticleOverlay';
