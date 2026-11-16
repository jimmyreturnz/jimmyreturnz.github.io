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
  const imgs: Record<string, HTMLImageElement> = {};
  for (const [k, f] of [...[0, 1, 2, 3].flatMap((i) => [[`a${i}`, `../mania/arrow-${i}`], [`r${i}`, `../mania/rec-${i}`], [`r${i}d`, `../mania/rec-${i}d`]]), ['bw', '../mania/bar-w'], ['bb', '../mania/bar-b'], ['bs', '../mania/bar-s'], ['left', 'bar-left'], ['right', 'bar-right'], ['inner', 'drum-inner'], ['outer', 'drum-outer']] as const) { const i = new Image(); i.onload = () => draw(); i.src = `/taiko/${f}.png`; imgs[k] = i; }

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

  // The playfield is built from the owner's skin pieces (assets/taiko/, recoloured to the theme): left panel with the four key boxes,
  // the lane, and the red/blue key lights. Notes are our own drawings. Keys D F J K = kat don don kat (kddk).
  function taiko(g: CanvasRenderingContext2D, W: number, H: number, t: number) {
    const d = data!, s = Math.min(0.9, (H - 16) / 200, W / 520), PH = 200 * s, py = (H - PH) / 2, PW = 180 * s;
    const laneH = 134 * s, y = py + laneH / 2, hitX = PW * 0.8, cur = posAt(t), im = imgs;
    if (im.right?.complete) g.drawImage(im.right, PW - 4, py, W - PW + 4, PH);
    if (im.left?.complete) g.drawImage(im.left, 0, py, PW, PH);
    // bar lines from the redlines
    g.strokeStyle = '#ffffff30'; g.lineWidth = 2;
    for (const [bt, bl, meter] of d.bars as [number, number, number][]) {
      const step = bl * meter; for (let b = bt + Math.max(0, Math.ceil((t - bt) / step - 6)) * step, n = 0; n < 40; b += step, n++) {
        const x = hitX + (posAt(b) - cur) * PX; if (x > W) break; if (x > PW && b >= bt) { g.beginPath(); g.moveTo(x, py + 6); g.lineTo(x, py + laneH - 6); g.stroke(); }
      }
    }
    // keys: notes just hit light their key (alternating hands: D/K for kat, F/J for don; big notes light both)
    const lit: [number, number][] = [];
    for (let i = Math.max(0, lower(d.notes, t - 110) - 1); i < d.notes.length && d.notes[i]![0]! <= t; i++) {
      const n = d.notes[i]!; if (n[1]! > 1 || t - n[0]! > 110) continue;
      const a = 1 - (t - n[0]!) / 110, kat = n[1] === 1, big = n[2] === 1, odd = i % 2;
      if (big) lit.push(kat ? [0, a] : [1, a], kat ? [3, a] : [2, a]); else lit.push([kat ? (odd ? 3 : 0) : (odd ? 2 : 1), a]);
    }
    const LET = ['D', 'F', 'J', 'K'];
    for (let k = 0; k < 4; k++) {
      const cx = (3 + 44 * k + 21) * s, a = Math.max(0, ...lit.filter((l) => l[0] === k).map((l) => l[1]));
      if (a > 0) { const img = k === 0 || k === 3 ? im.outer : im.inner; if (img?.complete) { g.globalAlpha = a; g.drawImage(img, cx - 45 * s, py, 90 * s, PH); g.globalAlpha = 1; } }
      g.fillStyle = a > 0 ? '#ffffff' : '#ffffffaa'; g.font = `700 ${Math.max(9, 12 * s)}px Orbitron, sans-serif`; g.textAlign = 'center';
      g.fillText(LET[k]!, cx, py + 192 * s);
    }
    // hit target
    g.strokeStyle = COL.line; g.lineWidth = 3; g.beginPath(); g.arc(hitX, y, laneH * 0.36, 0, 7); g.stroke();
    const maxPos = cur + W / PX, minPos = cur - hitX / PX;
    for (let i = Math.max(0, lower(d.notes, t - 4000) - 1); i < d.notes.length; i++) {
      const n = d.notes[i]!; if (n[0]! > t + 12000) break;
      const p = n[3]!; if (p > maxPos) break;
      const kind = n[1], x = hitX + (p - cur) * PX;
      if (kind === 2) { // drumroll [t,2,end,pos,posEnd]
        const x2 = hitX + (n[4]! - cur) * PX; if (x2 < PW) continue;
        g.fillStyle = COL.butter; g.globalAlpha = 0.85; g.beginPath(); g.roundRect(Math.max(PW, x), y - 14 * s, Math.max(8, x2 - Math.max(PW, x)), 28 * s, 14 * s); g.fill(); g.globalAlpha = 1; continue;
      }
      if (p < minPos || x < PW - 10) continue;
      const big = kind === 3 || n[2] === 1, r = big ? laneH * 0.4 : laneH * 0.29;
      g.globalAlpha = t > n[0]! ? Math.max(0, 1 - (t - n[0]!) / 120) : 1;
      g.fillStyle = kind === 1 ? COL.kat : COL.don; g.strokeStyle = COL.line; g.lineWidth = 3;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); g.globalAlpha = 1;
    }
  }

  // mania uses the skin's own pieces too (assets/mania/, recoloured): arrow notes + receptors for 4K, coloured bars for 7K
  function mania(g: CanvasRenderingContext2D, W: number, H: number, t: number) {
    const d = data!, k = d.keys, span = Number(stage.dataset.scrollMs) || 500, mx = k === 7 ? 0.08 : 0.18;
    const x0 = W * mx, cw = (W - 2 * x0) / k, hitY = H - 66;
    const LET = k === 7 ? ['S', 'D', 'F', '␣', 'J', 'K', 'L'] : ['D', 'F', 'J', 'K'];
    const colour = (i: number) => (k === 7 ? (i === 3 ? COL.butter : i % 2 === 0 ? COL.don : COL.kat) : i === 0 || i === 3 ? COL.kat : COL.don);
    const noteImg = (i: number) => (k === 7 ? (i === 3 ? imgs.bs : i % 2 === 0 ? imgs.bw : imgs.bb) : imgs[`a${i}`]);
    g.fillStyle = '#00000033'; g.fillRect(x0, 0, cw * k, H);
    g.strokeStyle = '#ffffff22'; g.lineWidth = 1;
    for (let i = 0; i <= k; i++) { g.beginPath(); g.moveTo(x0 + i * cw, 0); g.lineTo(x0 + i * cw, H); g.stroke(); }
    g.strokeStyle = '#fff8fc'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, hitY + 2); g.lineTo(x0 + cw * k, hitY + 2); g.stroke();
    const yOf = (nt: number) => hitY - ((nt - t) / span) * hitY;
    const lit = new Set<number>();
    for (let i = Math.max(0, lower(d.notes, t - 4000) - 1); i < d.notes.length && d.notes[i]![0]! <= t; i++) { const n = d.notes[i]!; if (n[2]! > 0 ? t < n[2]! : t - n[0]! < 90) lit.add(n[1]!); }
    const nh = k === 7 ? 18 : Math.min(cw * 0.9, 52);
    for (let i = Math.max(0, lower(d.notes, t - 400) - 40); i < d.notes.length; i++) {
      const n = d.notes[i]!; if (n[0]! > t + span) break;
      const hold = n[2]! > 0, end = hold ? n[2]! : n[0]!; if (end < t - 100) continue;
      const w = k === 7 ? cw * 0.86 : nh, x = x0 + n[1]! * cw + (cw - w) / 2, y = yOf(Math.max(n[0]!, hold ? t : n[0]!));
      if (hold) { const top = yOf(n[2]!); g.fillStyle = colour(n[1]!); g.globalAlpha = 0.75; g.fillRect(x + w * 0.18, top, w * 0.64, Math.max(0, y - top)); g.globalAlpha = 1; }
      if (hold && t > n[0]!) continue; // the held head stays on the line
      const im = noteImg(n[1]!);
      if (im?.complete && im.naturalWidth) g.drawImage(im, x, y - nh * (k === 7 ? 1 : 1), w, nh); else { g.fillStyle = colour(n[1]!); g.fillRect(x, y - 14, w, 14); }
    }
    g.textAlign = 'center'; g.font = '700 12px Orbitron, sans-serif';
    for (let i = 0; i < k; i++) {
      const on = lit.has(i), cx = x0 + i * cw + cw / 2;
      if (k === 4) { const r = imgs[`r${i}${on ? 'd' : ''}`]; if (r?.complete) g.drawImage(r, cx - 30, hitY - 4, 60, 48); }
      else { g.fillStyle = on ? colour(i) : COL.bg; g.strokeStyle = COL.line; g.lineWidth = 3; g.beginPath(); g.roundRect(x0 + i * cw + cw * 0.06, hitY + 6, cw * 0.88, 26, 8); g.fill(); g.stroke(); }
      g.fillStyle = on ? '#fff' : '#ffffffaa'; g.fillText(LET[i]!, cx, hitY + 54);
    }
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
