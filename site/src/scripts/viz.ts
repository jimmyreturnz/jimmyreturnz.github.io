// Visualizers: the Lobby's floor histogram (SVG bars) and the faint header bar (canvas). One shared rAF loop that
// only runs while something is on screen. Bars follow the real music, and sink out of sight when nothing plays.
import { levels } from './audio';
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
  const draw = () => follow(cur, levels(bars.length)).forEach((v, i) => { bars[i]!.style.transform = `scaleY(${v < 0.01 ? 0 : v})`; });
  if (reduced()) { draw(); return () => {}; }
  jobs.add(draw); kick();
  return () => jobs.delete(draw);
}

export function headerViz(canvas: HTMLCanvasElement): void {
  const cur: number[] = [];
  const g = canvas.getContext('2d')!;
  const fit = () => { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; };
  new ResizeObserver(fit).observe(canvas); fit();
  const draw = () => {
    const { width: w, height: h } = canvas, n = Math.max(24, Math.floor(w / 18)), bw = w / n;
    g.clearRect(0, 0, w, h);
    g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pink') || '#ffb3d1';
    g.globalAlpha = 0.3;
    follow(cur, levels(n)).forEach((v, i) => { if (v >= 0.01) g.fillRect(i * bw + 2, h - v * h * 0.9, bw - 4, v * h * 0.9); });
  };
  if (reduced()) { draw(); return; }
  jobs.add(draw); kick();
}
