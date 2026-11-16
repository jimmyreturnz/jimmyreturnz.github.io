// The Intro timeline (see components/Intro.astro and design-mocks/intro-storyboard.html).
// hold the power button 0.7 s → ripples → boot with a glitch → desktop + arrows → the wave falls to the floor
// histogram while the desktop windows fly into the Lobby cards. About 4.8 s after the hold; Skip is always there.
import { gsap } from 'gsap';
import { reduced } from './motion';
import { sfx, unlock, setSound } from './audio';

const root = document.documentElement;
const LOBBY = ['.bubble', '.id', '.role', '.about', '.facts', '.ctas', '.socials', '.player', '.enter'].map((s) => `.lobby ${s}`).join(',');
const BIOS = [
  'x3NiGMaZ BIOS v1.0',
  'CPU: heart @ 3.0GHz   MEM: 1337 MB ok ♥',
  'detecting... osu!taiko ✓ osu!mania ✓',
  'TETR.IO ✓ Python ✓',
  'booting jimmyreturnz...',
];

// pixel stickers for the desktop, drawn from bitmaps (1 outline, 2 fill, 3 shine); same sprites as KatsuDon Editor's NSO theme
const SPRITES: Record<string, [string[], [string, string, string]]> = {
  heart: [['0110110', '1221221', '1232221', '0122210', '0012100', '0001000'], ['#c2185b', '#ff7baf', '#ffebfa']],
  star: [['000010000', '000121000', '000121000', '111232111', '122222221', '012222210', '001222100', '012212210', '121101121', '110000011'], ['#c2185b', '#ffd355', '#ffffff']],
  moon: [['0011100', '0122100', '1221000', '1221000', '1221000', '0122110', '0011100'], ['#c2185b', '#fce2ba', '#ffffff']],
  spark: [['00100', '00300', '13331', '00300', '00100'], ['#c2185b', '#ffffff', '#ffffff']],
  bow: [['11000000011', '12100000121', '12211111221', '12223332221', '12211111221', '12100000121', '11000000011'], ['#c2185b', '#ff7baf', '#ffebfa']],
};
function sticker(name: string, px: number): SVGSVGElement {
  const [rows, cols] = SPRITES[name]!;
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', `0 0 ${rows[0]!.length} ${rows.length}`);
  s.setAttribute('width', String(rows[0]!.length * px)); s.setAttribute('height', String(rows.length * px));
  s.setAttribute('shape-rendering', 'crispEdges');
  rows.forEach((r, y) => [...r].forEach((c, x) => {
    if (c === '0') return;
    const q = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    q.setAttribute('x', String(x)); q.setAttribute('y', String(y)); q.setAttribute('width', '1'); q.setAttribute('height', '1'); q.setAttribute('fill', cols[Number(c) - 1]!);
    s.append(q);
  }));
  return s;
}

/** The Lobby's pieces pop in one by one (also used on its own when the Intro is not shown). */
export function lobbyIn(delay = 0) {
  const els = gsap.utils.toArray<HTMLElement>(LOBBY);
  if (!els.length) return;
  if (reduced()) { gsap.set(els, { clearProps: 'all' }); return; }
  gsap.fromTo(els, { y: 24, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, delay, stagger: 0.06, ease: 'back.out(1.4)', clearProps: 'all' });
}

function finish(el: HTMLElement) {
  try { localStorage.setItem('jr.intro', 'done'); } catch { /* private mode */ }
  delete root.dataset.intro;
  el.style.display = 'none';
}

function run(el: HTMLElement) {
  const q = <T extends Element = HTMLElement>(s: string) => el.querySelector<T>(s)!;
  const btn = q<HTMLButtonElement>('.pbtn'), ring = q<SVGCircleElement>('.prog'), power = q('[data-l="power"]'), boot = q('[data-l="boot"]'), desk = q('[data-l="desk"]');
  const bios = q('.bios'), logo = q('.logo'), bar = q('.lbar i'), login = q('.login'), wins = [...el.querySelectorAll<HTMLElement>('.win')];
  const arrows = [...el.querySelectorAll<SVGElement>('.arrows .vh')], path = q<SVGPathElement>('.wave path');
  const rip = [...el.querySelectorAll<SVGCircleElement>('.ripples circle')], skip = q('[data-skip]');
  const W = () => innerWidth, H = () => innerHeight;
  let started = false, held = false, tween: gsap.core.Tween | null = null, stopHum = () => {}, tl: gsap.core.Timeline | null = null;
  const lobbyEls = gsap.utils.toArray<HTMLElement>(LOBBY);

  // --- reduced motion: a still title card instead of the sequence ---
  if (reduced()) {
    btn.hidden = true; q('.hint').hidden = true; skip.hidden = true;
    const still = q('.still'); still.style.display = 'grid'; still.style.justifyItems = 'center';
    q<HTMLButtonElement>('[data-enter]').addEventListener('click', () => { gsap.set(lobbyEls, { clearProps: 'all' }); finish(el); }, { once: true });
    q<HTMLButtonElement>('[data-enter]').focus({ preventScroll: true });
    return;
  }

  // --- stickers ---
  const sticks = q('.stickers');
  Object.keys(SPRITES).concat(['heart', 'star', 'spark', 'bow', 'moon', 'spark']).forEach((n, i) => {
    const s = sticker(n, 5); s.style.left = `${6 + ((i * 37) % 86)}%`; s.style.top = `${8 + ((i * 53) % 78)}%`; sticks.append(s);
  });

  const cancelHold = () => {
    if (started) return;
    tween?.kill(); stopHum();
    gsap.to(ring, { strokeDashoffset: 326.7, duration: 0.25 }); gsap.to(btn, { scale: 1, duration: 0.2 });
  };
  const startHold = (dur: number) => {
    if (started) return;
    held = true; unlock(); setSound(true); stopHum(); stopHum = sfx.hum();
    tween = gsap.to(ring, { strokeDashoffset: 0, duration: dur, ease: 'none', onComplete: go });
    gsap.to(btn, { scale: 1.08, duration: dur });
  };
  btn.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') startHold(0.7); else { held = true; unlock(); setSound(true); } });
  btn.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') cancelHold();
    else if (!started) tween = gsap.to(ring, { strokeDashoffset: 0, duration: 0.25, onComplete: go }); // phone: one tap
  });
  btn.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') cancelHold(); });
  btn.addEventListener('pointercancel', cancelHold);
  btn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(0.7); } });
  btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') cancelHold(); });
  btn.addEventListener('click', () => { if (!held && !started) { unlock(); setSound(true); go(); } held = false; }); // screen readers: a plain press
  btn.focus({ preventScroll: true });

  skip.addEventListener('click', () => {
    started = true; tween?.kill(); stopHum(); tl?.kill();
    gsap.set(lobbyEls, { opacity: 0 });
    gsap.to(el, { opacity: 0, duration: 0.3, onComplete: () => { finish(el); lobbyIn(); } });
  });

  function go() {
    if (started) return;
    started = true; stopHum();
    const w = W(), h = H();
    gsap.set(lobbyEls, { opacity: 0 });
    tl = gsap.timeline({ onComplete: () => { finish(el); gsap.set(lobbyEls, { clearProps: 'all' }); } });

    // 1 · ripples
    tl.call(() => sfx.boom(), [], 0)
      .to(btn, { scale: 1.5, opacity: 0, duration: 0.25, ease: 'power2.out' }, 0)
      .to(q('.hint'), { opacity: 0, duration: 0.2 }, 0)
      .fromTo(el, { x: 0 }, { x: 5, duration: 0.04, repeat: 3, yoyo: true, clearProps: 'x' }, 0)
      .fromTo(rip, { scale: 0.2, opacity: 0.9 }, { scale: 18, opacity: 0, duration: 1, stagger: 0.08, ease: 'power2.out' }, 0);

    // 2 · boot with a glitch
    tl.set(power, { display: 'none' }, 0.7).set(boot, { display: 'grid' }, 0.7)
      .set(boot, { opacity: 1 }, 0.7);
    const burst = (t: number) => tl!.call(() => { sfx.crackle(); bios.classList.remove('glitch'); void bios.offsetWidth; bios.classList.add('glitch'); }, [], t);
    burst(0.75); burst(1.4);
    BIOS.forEach((line, i) => tl!.call(() => { bios.textContent += `${line}\n`; sfx.tick(); }, [], 0.78 + i * 0.12));
    tl.fromTo(logo, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 1.45)
      .call(() => sfx.chime(), [], 1.5)
      .to(bar, { scaleX: 1, duration: 0.55, ease: 'power1.inOut' }, 1.5);

    // 3 · auto login, desktop, arrows
    tl.to(logo, { opacity: 0, duration: 0.15 }, 2.05)
      .fromTo(login, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' }, 2.05)
      .to(login, { opacity: 0, duration: 0.15 }, 2.4)
      .set(desk, { display: 'grid' }, 2.45).to(desk, { opacity: 1, duration: 0.2 }, 2.45)
      .to(boot, { opacity: 0, duration: 0.2 }, 2.5)
      .fromTo(sticks.children, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, stagger: 0.03, ease: 'back.out(2)' }, 2.5)
      .fromTo(wins, { scale: 0.5, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 0.4, stagger: 0.12, ease: 'back.out(1.7)' }, 2.55)
      .call(() => sfx.pop(), [], 2.6).call(() => sfx.pop(), [], 2.72).call(() => sfx.swish(), [], 2.75);
    const ang = Math.atan2(-(h + 180), w + 260) * (180 / Math.PI);
    arrows.forEach((a, i) => tl!.fromTo(a, { x: -220, y: h + 40 - i * 90, rotation: ang, opacity: 1 }, { x: w + 40, y: -140 - i * 90 + (h * 0.15), duration: 0.85, ease: 'power2.inOut' }, 2.7 + i * 0.13));

    // 4 · the wave falls into the floor histogram; windows fly into the Lobby; the Lobby pops in
    const N = 48, st = { p: 0, ph: 0, a: 1 };
    const floorTop = () => { const f = document.querySelector('svg.floor')?.getBoundingClientRect(); return f ? f.top + f.height * 0.7 : h - 40; };
    const draw = () => {
      const ft = floorTop();
      path.setAttribute('d', Array.from({ length: N }, (_, i) => {
        const x = (i / (N - 1)) * w, wave = h * 0.5 + Math.sin(i * 0.45 + st.ph) * 60 * st.a;
        const y = wave + (ft - 8 * Math.sin(i * 0.6 + st.ph) - wave) * st.p;
        return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(''));
    };
    tl.call(draw, [], 3.45).call(() => sfx.shimmer(), [], 3.5)
      .to(path, { opacity: 1, duration: 0.15 }, 3.45)
      .to(st, { ph: 6, duration: 0.9, ease: 'none', onUpdate: draw }, 3.45)
      .to(st, { p: 1, duration: 0.55, ease: 'power3.in', onUpdate: draw }, 3.75)
      .to(path, { opacity: 0, duration: 0.25 }, 4.3)
      .to(el, { backgroundColor: 'transparent', duration: 0.01 }, 3.7)
      .to(desk, { opacity: 0, duration: 0.6, ease: 'power1.in' }, 3.75)
      .fromTo('svg.floor', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 4.1);
    [['.id', wins[0]], ['.player', wins[1]]].forEach(([sel, win]) => {
      const t = document.querySelector<HTMLElement>(`.lobby ${sel as string}`), c = (win as HTMLElement).getBoundingClientRect();
      if (!t) return;
      const r = t.getBoundingClientRect();
      tl!.to(win as HTMLElement, { x: `+=${r.left + r.width / 2 - (c.left + c.width / 2)}`, y: `+=${r.top + r.height / 2 - (c.top + c.height / 2)}`, scale: Math.min(1.4, r.width / c.width), opacity: 0, duration: 0.7, ease: 'power3.inOut' }, 3.75);
    });
    tl.add(() => lobbyIn(), 3.95).to(el, { opacity: 0, duration: 0.2 }, 4.65);
    tl.add(() => {}, 4.85);
    (window as unknown as { __introTl?: gsap.core.Timeline }).__introTl = tl; // handy for stepping through it in the console
  }
}

document.addEventListener('astro:page-load', () => {
  const el = document.getElementById('intro');
  if (el && root.dataset.intro === 'on') run(el);
  else if (document.querySelector('.lobby')) lobbyIn(0.05);
});
