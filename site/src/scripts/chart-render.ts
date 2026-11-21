// Draws the chart's notes on a canvas, following the song clock (`jr:chart-time` from chart-preview.ts).
// Notes come from /charts/<id>.json (made by scripts/osu-to-notes.mjs). Taiko scroll follows the redline BPM x
// green-line SV like taikoeditor; mania falls at a constant speed (data-scroll-ms on the stage).
import { hit, loadHits } from './audio';
const PX = 0.5; // taiko px per scroll unit (tune)
const COL = { don: '#ff7baf', kat: '#6fc3ff', butter: '#ffe27a', line: '#fff8fc', bg: '#2a2944' };

interface ManiaSkin {
  columnWidth: number[]; columnSpacing: number[]; columnLineWidth: number[]; hitPosition: number; keysUnderNotes: boolean; judgementLine: boolean;
  colourColumnLine: number[]; colours: number[][]; keys: (string | null)[][];
  notes: { n: string | null; h: string | null; l: string | null; t: string | null }[];
  stage: { left: string | null; right: string | null; hint: string | null }; lightingN: string[]; lightingL: string[];
}
let skin: Record<'k4' | 'k7', ManiaSkin> | null = null;
const cache = new Map<string, HTMLImageElement>();
const tints = new Map<string, HTMLCanvasElement>();
const lower2 = (a: number[], t: number) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m]! < t) lo = m + 1; else hi = m; } return lo; };
const pic = (src: string) => { let i = cache.get(src); if (!i) { i = new Image(); i.onload = () => document.dispatchEvent(new Event('jr:chart-redraw')); i.src = src; cache.set(src, i); } return i; };
/** Combo digits from the skin (assets/skin/<dir>/combo-N.png), centred on cx/cy, `h` px tall, `overlap` px like skin.ini ComboOverlap. */
function digits(g: CanvasRenderingContext2D, dir: string, n: number, cx: number, cy: number, h: number, overlap: number, pop: number) {
  const imgs = String(n).split('').map((c) => pic(`/skin/${dir}/combo-${c}.png`));
  if (imgs.some((i) => !i.complete || !i.naturalWidth)) return;
  const k = h / imgs[0]!.naturalHeight, ws = imgs.map((i) => i.naturalWidth * k), total = ws.reduce((a, b) => a + b, 0) - overlap * (imgs.length - 1);
  g.save(); g.translate(cx, cy); g.scale(pop, pop);
  let x = -total / 2; imgs.forEach((i, j) => { g.drawImage(i, x, -h / 2, ws[j]!, h); x += ws[j]! - overlap; });
  g.restore();
}
/** How many of the sorted times are at or before t, and a short "pop" (1 -> 1.2 -> 1) after the latest one. */
function comboAt(times: number[], t: number) { const n = lower2(times, t + 0.001); const since = n ? t - times[n - 1]! : 1e9; return { n, pop: 1 + 0.2 * Math.max(0, 1 - since / 110) }; }
const COMBO_Y = 130; // skin.ini ComboPosition for 4K and 7K
const skinReady = fetch('/skin/mania.json').then((r) => r.json()).then((j) => { skin = j; }).catch(() => {});

interface Data { sm: number; mode: 'taiko' | 'mania'; keys: number; bars: number[][]; knots: number[][]; notes: number[][] }
const lower = (a: number[][], t: number) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m]![0]! < t) lo = m + 1; else hi = m; } return lo; };

function setup(root: HTMLElement) {
  if (root.dataset.render) return;
  root.dataset.render = '1';
  const stage = root.querySelector<HTMLElement>('.stage')!;
  let data: Data | null = null, now = 0, last = 0, cv: HTMLCanvasElement | null = null;
  const ctx = () => cv!.getContext('2d')!;
  const halfTimes: number[][] = [[], [], [], [], []]; // autoplay hit times per drum half (1 left kat, 2 left don, 3 right don, 4 right kat)
  const events: { t: number; halves: number[]; snd: string[] }[] = [];
  let comboT: number[] = []; // times that add combo: taiko circles; mania note heads and hold ends
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

  // Taiko is drawn like KatsuDon Editor's gameplay viewer (ui/gameplay_view.py), from the owner's skin images in assets/skin/taiko/:
  // one unit u = H/200; hit x = 1.28 H; normal note 0.475 H wide; scroll = 1.12 H x SliderMultiplier x SV / beatLength px per ms, each note using
  // the speed in force at its own time; bar-right stretched over the strip, bar-left + drum halves on the left, hit target + ring at the hit x.
  const TAIKO = { don: [229, 76, 46], kat: [67, 141, 171], roll: [252, 184, 6] } as const;
  const tint = (img: HTMLImageElement, col: readonly number[], w: number, h: number) => {
    const key = `${img.src}|${col}|${Math.round(w)}x${Math.round(h)}`; let c = tints.get(key); if (c) return c;
    c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const x = c.getContext('2d')!; x.drawImage(img, 0, 0, c.width, c.height);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(img, 0, 0, c.width, c.height);
    tints.set(key, c); return c;
  };
  const tk = (n: string) => { const i = pic(`/skin/taiko/${n}.png`); return i.complete && i.naturalWidth ? i : null; };
  const vAt = (t: number) => { const k = data!.knots; const i = Math.max(0, lower(k, t + 0.001) - 1); return k[i]![2]!; };
  const bl0 = (tt: number) => { const b = data!.bars; let c = b[0]!; for (const x of b) { if (x[0]! > tt) break; c = x; } return c[1]!; };
  const alphaOf = (since: number, start: number) => { // the drum half's glow (KatsuDon _drum_hit_alpha)
    if (since < 0 || since >= 150) return 0;
    const fi = 80 * (1 - start); if (since < fi) { const q = since / fi; return start + (1 - start) * (1 - (1 - q) * (1 - q)); }
    return since < 100 ? 1 : 1 - (since - 100) / 50;
  };
  function taiko(g: CanvasRenderingContext2D, W: number, Hc: number, t: number) {
    const d = data!, H = Math.min(Hc, Math.max(170, W / 6.8267)), top = Math.max(0, Math.min(Hc - H, Hc * 0.32 - H / 2)), u = H / 200, cy = top + H / 2, hitX = 1.28 * H;
    const r = 0.2375 * H, R = r / 0.65, ppms = (v: number) => (1.12 * H * d.sm * v) / 300, xAt = (tt: number) => hitX + (tt - t) * ppms(vAt(tt));
    const bg = g.createLinearGradient(0, 0, 0, Hc); bg.addColorStop(0, '#1d2233'); bg.addColorStop(1, '#0d1017');
    g.fillStyle = bg; g.fillRect(0, 0, W, Hc);
    for (const [gx, gy, gc] of [[0.2, 0.85, '255,179,209'], [0.8, 0.7, '166,216,255'], [0.55, 1, '201,182,255']] as const) { // soft pastel glows in the empty play view
      const rg = g.createRadialGradient(W * gx, Hc * gy, 0, W * gx, Hc * gy, W * 0.4); rg.addColorStop(0, `rgba(${gc},.16)`); rg.addColorStop(1, `rgba(${gc},0)`); g.fillStyle = rg; g.fillRect(0, 0, W, Hc);
    }
    g.save(); g.beginPath(); g.rect(0, top, W, H); g.clip();
    const bar = tk('bar-right'); if (bar) g.drawImage(bar, 0, top, W, H);
    // barlines: every measure from each red line, scrolling like notes
    const barline = tk('barline'), last = d.notes[d.notes.length - 1]![0]! + 1;
    for (let i = 0; i < d.bars.length; i++) {
      const [bt, bl, meter] = d.bars[i] as [number, number, number], end = Math.min(d.bars[i + 1]?.[0] ?? Infinity, last), step = bl * meter;
      for (let k = Math.max(0, Math.floor((t - 3000 - bt) / step)), bx = bt + k * step; bx < end; k++, bx = bt + k * step) {
        if (bx > t + 20000) break; const x = xAt(bx); if (x < -2 || x > W + 2) continue;
        const bw = Math.max(1, Math.round((H * 4) / 200)), bh = Math.round((H * 175) / 200);
        if (barline) g.drawImage(barline, Math.round(x - bw / 2), Math.round(cy - bh / 2), bw, bh); else { g.fillStyle = '#e1e6f05a'; g.fillRect(Math.round(x), cy - 1.2 * R, 1, 2.4 * R); }
      }
    }
    // hit target (a faint big note) and the ring
    const bigC = tk('big'), ring = tk('ring');
    if (bigC) { const sz = (bigC.naturalWidth * 0.8 * u) / 2; g.globalAlpha = 0.22; g.drawImage(bigC, hitX - sz / 2, cy - sz / 2, sz, sz); g.globalAlpha = 1; }
    if (ring) { const sz = ring.naturalWidth * 0.83 * u; g.drawImage(ring, hitX - sz / 2, cy - sz / 2, sz, sz); }
    // notes: later ones first so earlier ones sit on top
    const lo = Math.max(0, lower(d.notes, t - 4000) - 1), hi = lower(d.notes, t + 20000);
    const circle = (x: number, col: readonly number[], big: boolean) => {
      const dia = (big ? R : r) * 2, base = tk(big ? 'big' : 'circle'), over = tk(big ? 'big-overlay' : 'circle-overlay');
      if (base) g.drawImage(tint(base, col, dia, dia), x - dia / 2, cy - dia / 2, dia, dia); else { g.fillStyle = `rgb(${col})`; g.beginPath(); g.arc(x, cy, dia / 2, 0, 7); g.fill(); }
      if (over) g.drawImage(over, x - dia / 2, cy - dia / 2, dia, dia);
    };
    for (let i = hi - 1; i >= lo; i--) {
      const n = d.notes[i]!, kind = n[1]!, x = xAt(n[0]!);
      if (kind <= 1) { if (t >= n[0]! || x - R > W) continue; circle(x, kind === 1 ? TAIKO.kat : TAIKO.don, n[2] === 1); continue; }
      const endT = n[2]!, ex = hitX + (endT - t) * ppms(vAt(n[0]!)); if (t >= endT || x - R > W || ex < -R) continue;
      if (kind === 2) { // drumroll
        const mid = tk('roll-middle'), cap = tk('roll-end'), dia = 2 * r;
        if (mid) g.drawImage(tint(mid, TAIKO.roll, Math.max(1, ex - x), dia), x, cy - dia / 2, Math.max(1, ex - x), dia);
        if (cap) { const cw = (cap.naturalWidth * dia) / cap.naturalHeight; g.drawImage(tint(cap, TAIKO.roll, cw, dia), ex, cy - dia / 2, cw, dia); }
        const sp = tk('scorepoint'); let tick = bl0(n[0]!) / 8; while (tick < 60) tick *= 2; while (tick > 120) tick /= 2;
        if (sp) for (let tt = n[0]! + tick; tt < endT; tt += tick) { if (tt <= t) continue; const tx = hitX + (tt - t) * ppms(vAt(n[0]!)), sz = (sp.naturalWidth * 2 * r) / 128; g.drawImage(sp, tx - sz / 2, cy - sz / 2, sz, sz); }
        circle(x, TAIKO.roll, false);
      } else { g.fillStyle = 'rgba(190,195,205,.35)'; g.beginPath(); g.roundRect(x, cy - R, Math.max(2, ex - x), 2 * R, R); g.fill(); }
    }
    // the input drum (bar-left + the lit halves), clipped to 180 units
    g.save(); g.beginPath(); g.rect(0, top, 180 * u, H); g.clip();
    const lb = tk('bar-left'); if (lb) g.drawImage(lb, 0, top, (lb.naturalWidth * u) / 2, (lb.naturalHeight * u) / 2); else { g.fillStyle = '#12151c'; g.fillRect(0, top, 180 * u, H); }
    const HALF: [string, number, boolean][] = [['drum-outer', 0, true], ['drum-inner', 0, false], ['drum-inner', 89.6, true], ['drum-outer', 89.6, false]]; // halves 1..4
    HALF.forEach(([name, hx, mirror], h) => {
      const times = halfTimes[h + 1]!, i = lower2(times, t + 0.001) - 1; if (i < 0) return;
      const a = alphaOf(t - times[i]!, i > 0 ? alphaOf(times[i]! - times[i - 1]!, 0) : 0), img = tk(name); if (!img || a <= 0) return;
      const w = (img.naturalWidth * u) / 2, ih = (img.naturalHeight * u) / 2; g.globalAlpha = a;
      if (mirror) { g.save(); g.translate(hx * u + w, 0); g.scale(-1, 1); g.drawImage(img, 0, top, w, ih); g.restore(); } else g.drawImage(img, hx * u, top, w, ih);
      g.globalAlpha = 1;
    });
    g.restore();
    // combo (vnl skin digits, ComboOverlap -2) on the left panel, just above the key indicator, over the drum art
    const cb = comboAt(comboT, t); if (cb.n) digits(g, 'taiko', cb.n, 90 * u, top + 0.5 * H, 0.24 * H, -2 * u, cb.pop);
    g.restore();
  }

  // mania: drawn like osu! stable from the owner's skin.ini ([Mania] 4K / 7K, assets/skin/mania.json) in a 480-high playfield:
  // columns at ColumnStart/ColumnWidth, notes scaled to column width with their bottom on HitPosition, keys at the bottom (over or under
  // the notes by KeysUnderNotes), stage borders, stage hint, judgement line, lighting. Unscaled skin images use H/768 like stable's HD skins.
  function mania(g: CanvasRenderingContext2D, W: number, H: number, t: number) {
    const d = data!, k = d.keys as 4 | 7, c = skin?.[`k${k}`]; if (!c) return;
    const span = Number(stage.dataset.scrollMs) || 500, PADB = 26, sc = (H - PADB) / 480, px = (H - PADB) / 768;
    const colX: number[] = []; let acc = 0;
    c.columnWidth.forEach((w, i) => { colX.push(acc); acc += w + (c.columnSpacing[i] ?? 0); });
    const sw = acc - (c.columnSpacing[k - 1] ?? 0), x0 = (W - sw * sc) / 2, hitY = c.hitPosition * sc, im = (n: string | null) => { const i = n ? pic(`/skin/mania/${n}`) : null; return i?.complete && i.naturalWidth ? i : null; };
    const yOf = (nt: number) => hitY - ((nt - t) / span) * 480 * sc;
    const LET = k === 7 ? ['S', 'D', 'F', '␣', 'J', 'K', 'L'] : ['C', 'V', ',', '.'];
    // which columns are being hit right now (autoplay presses a key for taps for 90 ms, and for the whole length of a hold)
    const down = new Set<number>(), strikes: [number, number, boolean][] = [];
    for (let i = Math.max(0, lower(d.notes, t - 4000) - 1); i < d.notes.length && d.notes[i]![0]! <= t; i++) {
      const n = d.notes[i]!, hold = n[2]! > 0;
      if (hold ? t < n[2]! : t - n[0]! < 90) down.add(n[1]!);
      if (t - n[0]! < 160) strikes.push([n[1]!, t - n[0]!, hold]);
    }
    // 1 · lane backgrounds (Colour#), column lines
    colX.forEach((cx, i) => { const [r, gg, b, a] = c.colours[i]!; g.fillStyle = `rgba(${r},${gg},${b},${(a ?? 255) / 255})`; g.fillRect(x0 + cx * sc, 0, c.columnWidth[i]! * sc, 480 * sc); });
    const cl = c.colourColumnLine; g.fillStyle = `rgba(${cl[0]},${cl[1]},${cl[2]},${(cl[3] ?? 255) / 255})`;
    for (let i = 0; i <= k; i++) { const lw = (c.columnLineWidth[i] ?? 0) * sc; if (lw > 0) g.fillRect(x0 + (i ? colX[i - 1]! + c.columnWidth[i - 1]! : 0) * sc - lw / 2, 0, lw, 480 * sc); }
    // 2 · stage hint + judgement line at HitPosition
    const hint = im(c.stage.hint); if (hint) g.drawImage(hint, x0, hitY - (hint.naturalHeight * px) / 2, sw * sc, hint.naturalHeight * px);
    if (c.judgementLine) { g.fillStyle = '#fff'; g.fillRect(x0, hitY - 1, sw * sc, 2); }
    // key images: bottom of the playfield, stretched to column width
    const keys = () => c.keys.forEach(([up, dn], i) => { const key = im(down.has(i) ? dn : up); if (!key) return; const w = c.columnWidth[i]! * sc, h = (key.naturalHeight * w) / key.naturalWidth; g.drawImage(key, x0 + colX[i]! * sc, 480 * sc - h, w, h); });
    if (c.keysUnderNotes) keys();
    // 3 · notes (and hold bodies), nearest the hit position last
    for (let i = Math.max(0, lower(d.notes, t - 400) - 40); i < d.notes.length; i++) {
      const n = d.notes[i]!; if (n[0]! > t + span * 1.05) break;
      const hold = n[2]! > 0, endT = hold ? n[2]! : n[0]!; if (endT <= t) continue; // autoplay hits it exactly on time: a note disappears at the hit position, a hold ends there
      const col = n[1]!, w = c.columnWidth[col]! * sc, x = x0 + colX[col]! * sc, def = c.notes[col]!;
      const head = im(hold ? def.h : def.n) ?? im(def.n), hh = head ? (head.naturalHeight * w) / head.naturalWidth : 0;
      const yHead = yOf(hold && t > n[0]! ? t : n[0]!);
      if (hold) {
        const yTail = yOf(n[2]!), tail = im(def.t) ?? head, th = tail ? (tail.naturalHeight * w) / tail.naturalWidth : 0, body = im(def.l);
        const top = yTail - th / 2, bot = yHead - hh / 2;
        if (body && bot > top) { g.save(); g.globalAlpha = down.has(col) ? 1 : 0.9; g.drawImage(body, x, top, w, bot - top); g.restore(); }
        // 4K: the hold end reuses the head arrow, so draw it upside down (like the game does)
        if (tail && k === 4) { g.save(); g.translate(x, yTail); g.scale(1, -1); g.drawImage(tail, 0, 0, w, th); g.restore(); }
        else if (tail) g.drawImage(tail, x, yTail - th, w, th);
      }
      if (head) g.drawImage(head, x, yHead - hh, w, hh);
    }
    if (!c.keysUnderNotes) keys();
    // 4 · stage borders (left image's right edge on the stage's left edge, right image's left edge on its right edge)
    const L = im(c.stage.left), R = im(c.stage.right);
    if (L) g.drawImage(L, x0 - L.naturalWidth * px, 0, L.naturalWidth * px, 480 * sc);
    if (R) g.drawImage(R, x0 + sw * sc, 0, R.naturalWidth * px, 480 * sc);
    // 5 · lighting at the hit position (additive)
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [col, age, hold] of strikes) {
      const fr = hold ? c.lightingL : c.lightingN; if (!fr.length) continue;
      const f = im(fr[Math.min(fr.length - 1, Math.floor(age / (1000 / 60)))]!); if (!f) continue;
      const w = f.naturalWidth * px, h = f.naturalHeight * px; g.drawImage(f, x0 + (colX[col]! + c.columnWidth[col]! / 2) * sc - w / 2, hitY - h / 2, w, h);
    }
    for (const col of down) if (c.lightingL.length && [...strikes].every((s) => s[0] !== col)) { const f = im(c.lightingL[0]!); if (f && d.notes.some((n) => n[1] === col && n[2]! > 0 && n[0]! <= t && t < n[2]!)) { const w = f.naturalWidth * px, h = f.naturalHeight * px; g.drawImage(f, x0 + (colX[col]! + c.columnWidth[col]! / 2) * sc - w / 2, hitY - h / 2, w, h); } }
    g.restore();
    // combo: the top layer, over notes, borders and lighting
    const cm = comboAt(comboT, t); if (cm.n) digits(g, 'mania', cm.n, x0 + (sw * sc) / 2, COMBO_Y * sc, 56 * px, 0, cm.pop);
    // key letters under the stage
    g.textAlign = 'center'; g.font = '700 12px Orbitron, sans-serif';
    for (let i = 0; i < k; i++) { g.fillStyle = down.has(i) ? '#ffffff' : '#ffffffaa'; g.fillText(LET[i]!, x0 + (colX[i]! + c.columnWidth[i]! / 2) * sc, H - 8); }
  }

  const start = async () => {
    if (data || cv) return;
    try { data = (await (await fetch(`/charts/${root.dataset.chart}.json`)).json()) as Data; await skinReady; buildEvents(); } catch { return; }
    comboT = (data.mode === 'taiko' ? data.notes.filter((n) => n[1]! <= 1).map((n) => n[0]!) : data.notes.flatMap((n) => (n[2]! > 0 ? [n[0]!, n[2]!] : [n[0]!]))).sort((a, b) => a - b);
    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach((c) => { pic(`/skin/${data!.mode}/combo-${c}.png`); });
    cv = document.createElement('canvas'); cv.className = 'notes'; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    stage.querySelectorAll('.taiko,.mania').forEach((e) => e.remove());
    stage.prepend(cv); resize(); new ResizeObserver(resize).observe(stage);
  };
  // autoplay (like KatsuDon): hands alternate per circle starting on the right, restarting after a 4-beat gap; big notes use both hands;
  // drumroll ticks alternate the don halves. Each event also makes the hit sounds.
  const buildEvents = () => {
    const d = data!; if (d.mode !== 'taiko') return;
    let hand = 0, prev = -1e9; const gap = d.bars[0]![1]! * 4;
    const add = (tt: number, halves: number[], snd: string[]) => { events.push({ t: tt, halves, snd }); halves.forEach((h) => halfTimes[h]!.push(tt)); };
    for (const n of d.notes) {
      const kind = n[1]!, tt = n[0]!;
      if (kind <= 1) {
        if (tt - prev >= gap) hand = 0;
        prev = tt;
        const big = n[2] === 1, kat = kind === 1, mine = kat ? (hand ? 1 : 4) : (hand ? 2 : 3);
        add(tt, big ? (kat ? [1, 4] : [2, 3]) : [mine], kat ? (big ? ['clap', 'finish'] : ['clap']) : (big ? ['normal', 'finish'] : ['normal']));
        hand ^= 1;
      } else if (kind === 2) {
        let q = bl0(tt) / 8; while (q < 60) q *= 2; while (q > 120) q /= 2;
        let h = 0; for (let x = tt; x <= n[2]!; x += q) { add(x, [h ? 2 : 3], ['normal']); h ^= 1; }
        prev = n[2]!;
      }
    }
    events.sort((a, b) => a.t - b.t); halfTimes.forEach((a) => a.sort((x, y) => x - y));
  };
  const lowerEv = (t: number) => { let lo = 0, hi = events.length; while (lo < hi) { const m = (lo + hi) >> 1; if (events[m]!.t < t) lo = m + 1; else hi = m; } return lo; };
  const autoplay = (from: number, to: number) => {
    if (!data || data.mode !== 'taiko') return;
    const a = from * 1000, b = to * 1000, names: string[] = [];
    for (let i = lowerEv(a + 0.0001); i < events.length && events[i]!.t <= b; i++) names.push(...events[i]!.snd);
    if (names.length) hit(names);
  };
  document.addEventListener('jr:chart-redraw', () => draw());
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
