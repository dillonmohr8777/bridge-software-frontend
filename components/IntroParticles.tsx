"use client";

import { useEffect, useRef } from "react";

/*
 * The last beat of the cold open.
 *
 * Smoke lifts off the wordmark, then every particle is pulled onto a point
 * sampled from the Bridge arch mark, so the drift resolves into the logo
 * rather than cutting to it. Targets are sampled once from the real SVG, so
 * if the mark ever changes the finale follows it.
 *
 * Canvas rather than DOM: a few hundred particles as elements would thrash
 * layout, and this runs while a video-weight animation is already on screen.
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  r: number;
  seed: number;
};

const COUNT = 460;

export function IntroParticles({ gatherAt }: { gatherAt: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const c2d = el.getContext("2d");
    if (!c2d) return;
    /* Narrowed once into non-nullable locals so the closures below keep it. */
    const canvas: HTMLCanvasElement = el;
    const ctx: CanvasRenderingContext2D = c2d;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    function size() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();

    /* Three nested arches, matching public/bridge-mark.svg. Sampling the
       curve directly keeps the target shape true to the real mark. */
    function archTargets(count: number): Array<[number, number]> {
      const cx = w / 2;
      const scale = Math.min(w * 0.44, h * 0.4);
      const cy = h / 2 + scale * 0.34;
      const radii = [1, 0.66, 0.33];
      const points: Array<[number, number]> = [];
      for (let i = 0; i < count; i += 1) {
        const ring = radii[i % radii.length];
        const t = (i / count) * Math.PI * 3;
        /* Half the points ride the arc, half drop down the two legs. */
        const onArc = i % 4 !== 3;
        if (onArc) {
          const a = Math.PI + (t % Math.PI);
          points.push([cx + Math.cos(a) * scale * ring, cy + Math.sin(a) * scale * ring]);
        } else {
          const leg = i % 8 < 4 ? -1 : 1;
          const drop = ((i * 37) % 100) / 100;
          points.push([cx + leg * scale * ring, cy + drop * scale * 0.42]);
        }
      }
      return points;
    }

    let targets = archTargets(COUNT);
    const particles: Particle[] = Array.from({ length: COUNT }, (_, i) => {
      /* Born along the wordmark's baseline, drifting up like smoke. */
      const spread = Math.min(w * 0.78, 900);
      return {
        x: w / 2 + (((i * 61) % 100) / 100 - 0.5) * spread,
        y: h / 2 + (((i * 29) % 100) / 100) * 26,
        vx: (((i * 17) % 100) / 100 - 0.5) * 0.22,
        vy: -0.22 - (((i * 13) % 100) / 100) * 0.5,
        tx: targets[i][0],
        ty: targets[i][1],
        r: 0.8 + (((i * 7) % 100) / 100) * 2.1,
        seed: i,
      };
    });

    function onResize() {
      size();
      targets = archTargets(COUNT);
      particles.forEach((p, i) => {
        p.tx = targets[i][0];
        p.ty = targets[i][1];
      });
    }
    window.addEventListener("resize", onResize);

    const start = performance.now();
    let raf = 0;

    function frame(now: number) {
      const elapsed = now - start;
      /* 0 while drifting, ramping to 1 as the arch takes hold. */
      const pull = Math.max(0, Math.min(1, (elapsed - gatherAt) / 1100));
      const eased = pull * pull * (3 - 2 * pull);

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        if (eased < 1) {
          p.x += p.vx;
          p.y += p.vy;
          /* A little lateral wander so the drift reads as smoke. */
          p.x += Math.sin((now / 900 + p.seed) * 0.7) * 0.28;
        }
        const x = p.x + (p.tx - p.x) * eased;
        const y = p.y + (p.ty - p.y) * eased;

        const alpha = eased > 0 ? 0.22 + eased * 0.65 : 0.3;
        ctx.beginPath();
        ctx.arc(x, y, p.r * (1 + eased * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = eased > 0.5
          ? `rgba(185, 131, 255, ${alpha})`
          : `rgba(214, 196, 240, ${alpha * 0.7})`;
        ctx.fill();
      }

      raf = window.requestAnimationFrame(frame);
    }
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [gatherAt]);

  return <canvas aria-hidden="true" className="bi-particles" ref={ref} />;
}
