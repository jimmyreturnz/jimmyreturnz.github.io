// 3D tilt + glare on [data-tilt] cards: follows a mouse or pen (phones get none, no gyro), off with reduced motion.
// One delegated listener on document, so it keeps working across page changes without re-init.
import { reduced } from './motion';

const MAX = 5; // degrees at the card's edge
const fine = matchMedia('(hover: hover) and (pointer: fine)');
let cur: HTMLElement | null = null, raf = 0, px = 0, py = 0;

const reset = (el: HTMLElement) => { el.classList.remove('tilting'); for (const k of ['--rx', '--ry', '--gx', '--gy']) el.style.removeProperty(k); };

document.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch' || !fine.matches || reduced()) return;
  const el = (e.target as Element | null)?.closest<HTMLElement>('[data-tilt]') ?? null;
  if (el !== cur) { if (cur) reset(cur); cur = el; }
  if (!el) return;
  px = e.clientX; py = e.clientY;
  raf ||= requestAnimationFrame(() => {
    raf = 0;
    if (!cur) return;
    const r = cur.getBoundingClientRect(), x = (px - r.left) / r.width, y = (py - r.top) / r.height;
    cur.style.setProperty('--rx', `${((0.5 - y) * 2 * MAX).toFixed(2)}deg`);
    cur.style.setProperty('--ry', `${((x - 0.5) * 2 * MAX).toFixed(2)}deg`);
    cur.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
    cur.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    cur.classList.add('tilting');
  });
}, { passive: true });

// pointer left the window: let the card settle back
document.documentElement.addEventListener('pointerleave', () => { if (cur) reset(cur); cur = null; });
