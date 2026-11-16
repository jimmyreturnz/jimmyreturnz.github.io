// Draws the chart's notes on a canvas, following the song clock (`jr:chart-time` from chart-preview.ts).
// Notes come from /charts/<id>.json (made by scripts/osu-to-notes.mjs). Taiko scroll follows the redline BPM x
// green-line SV like taikoeditor; mania falls at a constant speed (data-scroll-ms on the stage).
import { hit, loadHits } from './audio';
const PX = 0.5; // taiko px per scroll unit (tune)
const COL = { don: '#ff7baf', kat: '#6fc3ff', butter: '#ffe27a', line: '#fff8fc', bg: '#2a2944' };

interface Data { mode: 'taiko' | 'mania'; keys: number; bars: number[][]; knots: number[][]; notes: number[][] }
const lower = (a: number[][], t: number) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m]![0]! < t) lo = m + 1; else hi = m; } return lo; };

function setup(root: HTMLElement) {
  if (root.dataset.render) return;
  root.dataset.render = '1';
  const stage = root.querySelector<HTMLElement>('.stage')!;
  let data: Data | null = null, now = 0, last = 0, cv: HTMLCanvasElement | null = null;
  const ctx = () => cv!.getContext('2d')!;

  const resize = () => {
    if (!cv) return;
    const r = stage.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    if (!r.width) return;
    cv.width = r.width * d; cv.height = r.height * d; ctx().setTransform(d, 0, 0, d, 0, 0); draw();
  };

  const posAt = (t: number) => { const k = data!.knots; let c = k[0]!; for (let i = lower(k, t + 0.001) - 1; i >= 0; i--) { c = k[i]!; break; } return c[1]! + c[2]! * (t - c[0]!); };

  function draw() {
    if (!data || !cv) return;
    const g = ctx(), W = stage.clientWidth, H = stage.clientHeight, t = now * 1000;
    g.clearRect(0, 0, W, H);
    data.mode === 'taiko' ? taiko(g, W, H, t) : mania(g, W, H, t);
  }

  function taiko(g: CanvasRenderingContext2D, W: number, H: number, t: number) {
    const d = data!, laneH = Math.min(88, H * 0.5), y = H / 2, hitX = 16 + 48 + 40, cur = posAt(t);
    g.fillStyle = COL.bg; g.fillRect(0, y - laneH / 2, W, laneH);
    g.strokeStyle = COL.line; g.lineWidth = 3; g.strokeRect(-4, y - laneH / 2, W + 8, laneH);
    // bar lines from the redlines
    g.strokeStyle = '#ffffff30'; g.lineWidth = 2;
    for (const [bt, bl, meter] of d.bars as [number, number, number][]) {
      const step = bl * meter; for (let b = bt + Math.max(0, Math.ceil((t - bt) / step - 6)) * step, n = 0; n < 40; b += step, n++) {
        const x = hitX + (posAt(b) - cur) * PX; if (x > W) break; if (x > 0 && b >= bt) { g.beginPath(); g.moveTo(x, y - laneH / 2); g.lineTo(x, y + laneH / 2); g.stroke(); }
      }
    }
    // hit circle (drum target), flashing in the colour of the note that was just hit
    let flash: number[] | null = null;
    for (let i = Math.max(0, lower(d.notes, t - 120) - 1); i < d.notes.length && d.notes[i]![0]! <= t; i++) { const n = d.notes[i]!; if (n[1]! <= 1 && t - n[0]! < 120) flash = n; }
    if (flash) { g.fillStyle = flash[1] === 1 ? COL.kat : COL.don; g.globalAlpha = 0.7 * (1 - (t - flash[0]!) / 120); g.beginPath(); g.arc(hitX, y, laneH * 0.55, 0, 7); g.fill(); g.globalAlpha = 1; }
    g.strokeStyle = COL.line; g.lineWidth = 4; g.beginPath(); g.arc(hitX, y, laneH * 0.45, 0, 7); g.stroke();
    const maxPos = cur + W / PX, minPos = cur - 200 / PX;
    for (let i = Math.max(0, lower(d.notes, t - 4000) - 1); i < d.notes.length; i++) {
      const n = d.notes[i]!; if (n[0]! > t + 12000) break;
      const p = n[1] === 2 ? n[3]! : n[3]!; if (p > maxPos) break;
      const kind = n[1], x = hitX + (p - cur) * PX;
      if (kind === 2) { // drumroll [t,2,end,pos,posEnd]
        const x2 = hitX + (n[4]! - cur) * PX; if (x2 < -40) continue;
        g.fillStyle = COL.butter; g.globalAlpha = 0.85; g.beginPath(); g.roundRect(x, y - 16, Math.max(8, x2 - x), 32, 16); g.fill(); g.globalAlpha = 1; continue;
      }
      if (p < minPos) continue;
      if (t > n[0]! + 0 && t > n[0]!) { /* passed the line: fade out */ }
      const big = kind === 3 || n[2] === 1, r = big ? laneH * 0.4 : laneH * 0.28;
      g.globalAlpha = t > n[0]! ? Math.max(0, 1 - (t - n[0]!) / 120) : 1;
      g.fillStyle = kind === 1 ? COL.kat : COL.don; g.strokeStyle = COL.line; g.lineWidth = 3;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); g.globalAlpha = 1;
    }
  }

  function mania(g: CanvasRenderingContext2D, W: number, H: number, t: number) {
    const d = data!, k = d.keys, span = Number(stage.dataset.scrollMs) || 500, mx = k === 7 ? 0.08 : 0.18;
    const x0 = W * mx, cw = (W - 2 * x0) / k, hitY = H - 44, nh = k === 7 ? 12 : 16;
    g.strokeStyle = '#ffffff22'; g.lineWidth = 1;
    for (let i = 0; i <= k; i++) { g.beginPath(); g.moveTo(x0 + i * cw, 0); g.lineTo(x0 + i * cw, H); g.stroke(); }
    const colour = (i: number) => (k === 7 ? (i === 3 ? COL.butter : i % 2 === 0 ? COL.kat : COL.don) : i === 0 || i === 3 ? COL.kat : COL.don);
    const yOf = (nt: number) => hitY - ((nt - t) / span) * hitY;
    for (let i = Math.max(0, lower(d.notes, t - 400) - 40); i < d.notes.length; i++) {
      const n = d.notes[i]!; if (n[0]! > t + span) break;
      const end = n[2]! > 0 ? n[2]! : n[0]!; if (end < t - 100) continue;
      const x = x0 + n[1]! * cw + cw * 0.08, w = cw * 0.84, y = yOf(n[0]!);
      g.fillStyle = colour(n[1]!); g.strokeStyle = '#1f1e33'; g.lineWidth = 2;
      if (n[2]! > 0) { const top = yOf(n[2]!), bot = Math.min(y, hitY); g.globalAlpha = 0.8; g.fillRect(x + w * 0.15, top, w * 0.7, bot - top); g.globalAlpha = 1; }
      if (!(n[2]! > 0 && t > n[0]!)) { g.beginPath(); g.roundRect(x, y - nh, w, nh, 5); g.fill(); g.stroke(); }
    }
    const lit = new Set<number>();
    for (let i = Math.max(0, lower(d.notes, t - 4000) - 1); i < d.notes.length && d.notes[i]![0]! <= t; i++) { const n = d.notes[i]!; if (t - Math.max(n[0]!, n[2]! > 0 ? 0 : n[0]!) < 90 || (n[2]! > 0 && t < n[2]!)) lit.add(n[1]!); }
    g.strokeStyle = COL.line; g.lineWidth = 3;
    for (let i = 0; i < k; i++) { g.fillStyle = lit.has(i) ? colour(i) : COL.bg; g.beginPath(); g.roundRect(x0 + i * cw + cw * 0.06, hitY + 4, cw * 0.88, 20, 8); g.fill(); g.stroke(); }
  }

  const start = async () => {
    if (data || cv) return;
    try { data = (await (await fetch(`/charts/${root.dataset.chart}.json`)).json()) as Data; } catch { return; }
    cv = document.createElement('canvas'); cv.className = 'notes'; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    stage.querySelectorAll('.taiko,.mania').forEach((e) => e.remove());
    stage.prepend(cv); resize(); new ResizeObserver(resize).observe(stage);
  };
  // autoplay: when the clock moves forward a little (playing, not a seek) the notes it passed make their hit sounds
  const autoplay = (from: number, to: number) => {
    if (!data || data.mode !== 'taiko') return;
    const a = from * 1000, b = to * 1000, names: string[] = [];
    for (let i = lower(data.notes, a + 0.0001); i < data.notes.length && data.notes[i]![0]! <= b; i++) {
      const n = data.notes[i]!; if (n[1]! > 1) continue;
      names.push(n[1] === 1 ? 'clap' : 'normal'); if (n[2] === 1) names.push('finish');
    }
    if (names.length) hit(names);
  };
  root.addEventListener('jr:chart-time', (e) => {
    now = (e as CustomEvent<number>).detail;
    const dt = now - last; if (dt > 0 && dt < 0.25) autoplay(last, now);
    last = now; draw();
  });
  root.querySelector('audio')?.addEventListener('play', () => void loadHits());
  new IntersectionObserver((es, o) => { if (es.some((x) => x.isIntersecting)) { o.disconnect(); void start(); } }).observe(root);
  // stacked panels stay rendered but hidden: re-measure when a panel is shown
  new MutationObserver(resize).observe(root, { attributes: true, attributeFilter: ['hidden'] });
}

document.addEventListener('astro:page-load', () => document.querySelectorAll<HTMLElement>('[data-chart]').forEach(setup));
