// Visualizers: the Lobby's floor histogram (SVG bars) and the faint header bar (canvas). One shared rAF loop that
// only runs while something is on screen. Bars follow the real music when it plays, a gentle wave otherwise.
import { levels, hasSignal } from './audio';
import { reduced } from './motion';

const jobs = new Set<(t: number) => void>();
let raf = 0, last = 0;
function loop(now: number) {
  raf = 0;
  if (!jobs.size || document.hidden) return;
  if (now - last >= 16) { last = now; jobs.forEach((j) => j(now / 1000)); }
  raf = requestAnimationFrame(loop);
}
const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
document.addEventListener('visibilitychange', kick);

// fast attack, slower fall: bars snap up on a hit and drop back
const follow = (cur: number[], next: number[]) => next.map((v, i) => (cur[i] = v > (cur[i] ?? 0) ? v : (cur[i] ?? 0) * 0.84 + v * 0.16));

export function floorHistogram(svg: SVGSVGElement): () => void {
  const bars = [...svg.querySelectorAll<SVGRectElement>('rect')], cur: number[] = [];
  const draw = (t: number) => follow(cur, levels(bars.length, t)).forEach((v, i) => { bars[i]!.style.transform = `scaleY(${Math.max(0.04, v)})`; });
  if (reduced()) { draw(0); return () => {}; }
  jobs.add(draw); kick();
  return () => jobs.delete(draw);
}

export function headerViz(canvas: HTMLCanvasElement): void {
  const cur: number[] = [];
  const g = canvas.getContext('2d')!;
  const fit = () => { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; };
  new ResizeObserver(fit).observe(canvas); fit();
  const draw = (t: number) => {
    const { width: w, height: h } = canvas, n = Math.max(24, Math.floor(w / 18)), bw = w / n;
    g.clearRect(0, 0, w, h);
    const live = hasSignal() || localStorage.getItem('jr.sound') === 'true';
    g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pink') || '#ffb3d1';
    g.globalAlpha = live ? 0.3 : 0.1;
    follow(cur, levels(n, t, live)).forEach((v, i) => { const bh = (live ? v : 0.2 + v * 0.3) * h * 0.9; g.fillRect(i * bw + 2, h - bh, bw - 4, bh); });
  };
  if (reduced()) { draw(0); return; }
  jobs.add(draw); kick();
}
