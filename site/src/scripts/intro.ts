// The Intro timeline (see components/Intro.astro and design-mocks/intro-storyboard.html).
// hold the power button 0.7 s → ripples → boot with a glitch → the Lobby pops in
// About 3.3 s after the hold at full speed; Skip is always there.
import { gsap } from 'gsap';
import { reduced } from './motion';
import { rollIn } from './roll';
import { sfx, unlock, setSound } from './audio';

const root = document.documentElement;
const LOBBY = ['.bar', '.sky .h1', '.sky .h2', '.sky .s1', '.sky .s2', '.bubble', '.id', '.role', '.about', '.facts', '.ctas', '.socials', '.player'].map((s) => `.lobby ${s}`).join(',');
const BIOS = [
  'x3NiGMaZ BIOS v1.0',
  'CPU: heart @ 3.0GHz   MEM: 1337 MB ok ♥',
  'detecting... osu!taiko ✓ osu!mania ✓',
  'TETR.IO ✓ Python ✓',
  'booting jimmyreturnz...',
];

/** The Lobby's pieces pop in one by one (also used on its own when the Intro is not shown). */
const INTRO_SPEED = 0.5;

export function lobbyIn(delay = 0) {
  document.dispatchEvent(new Event('jr:lobby')); // the BGM starts here
  const els = gsap.utils.toArray<HTMLElement>(LOBBY);
  if (!els.length) return;
  if (reduced()) { gsap.set(els, { clearProps: 'all' }); return; }
  // the Player Card numbers count up as it arrives (stacked tab panels aren't seen by scroll observers)
  gsap.delayedCall(delay + 0.45, () => { const pc = document.querySelector<HTMLElement>('.lobby .player'); if (pc) rollIn(pc); });
  gsap.fromTo(els, { y: 24, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, delay, stagger: 0.06, ease: 'back.out(1.4)', clearProps: root.dataset.intro ? '' : 'all' });
}

function finish(el: HTMLElement) {
  document.dispatchEvent(new Event('jr:lobby'));
  try { localStorage.setItem('jr.intro', 'done'); } catch { /* private mode */ }
  delete root.dataset.intro;
  el.style.display = 'none';
}

function run(el: HTMLElement) {
  const q = <T extends Element = HTMLElement>(s: string) => el.querySelector<T>(s)!;
  const btn = q<HTMLButtonElement>('.pbtn'), ring = q<SVGCircleElement>('.prog'), power = q('[data-l="power"]'), boot = q('[data-l="boot"]');
  const bios = q('.bios'), logo = q('.logo'), bar = q('.lbar i'), login = q('.login');
  const rip = [...el.querySelectorAll<SVGCircleElement>('.ripples circle')], flash = q('.flash'), skip = q('[data-skip]');
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

  // holding builds up: glow grows, the button shakes harder, a pink vignette closes in
  let shake: ((t: number, dt: number) => void) | null = null;
  const buildUp = () => {
    shake = () => { const p = tween?.progress() ?? 0, a = p * p * 5; gsap.set(btn, { x: (Math.random() - 0.5) * a, y: (Math.random() - 0.5) * a }); el.style.setProperty('--hold', String(p)); };
    gsap.ticker.add(shake);
  };
  const clearBuildUp = () => {
    if (shake) gsap.ticker.remove(shake); shake = null;
    gsap.to(btn, { x: 0, y: 0, duration: 0.15 }); gsap.to(el, { '--hold': 0, duration: 0.25 });
  };
  const cancelHold = () => {
    if (started) return;
    tween?.kill(); stopHum(); clearBuildUp();
    gsap.to(ring, { strokeDashoffset: 326.7, duration: 0.25 }); gsap.to(btn, { scale: 1, duration: 0.2 });
  };
  const startHold = (dur: number) => {
    if (started) return;
    held = true; unlock(); setSound(true); stopHum(); stopHum = sfx.hum();
    tween = gsap.to(ring, { strokeDashoffset: 0, duration: dur, ease: 'none', onComplete: () => { clearBuildUp(); go(); } });
    gsap.to(btn, { scale: 1.12, duration: dur, ease: 'power2.in' });
    buildUp();
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
    gsap.set(lobbyEls, { opacity: 0 });
    tl = gsap.timeline({ onComplete: () => { finish(el); gsap.set(lobbyEls, { clearProps: 'all' }); } });
    tl.timeScale(INTRO_SPEED); // the whole Intro runs at this speed (0.5 = about 10 seconds)

    // 1 · ripples
    tl.call(() => sfx.boom(), [], 0)
      .to(btn, { scale: 1.5, opacity: 0, duration: 0.25, ease: 'power2.out' }, 0)
      .to(q('.hint'), { opacity: 0, duration: 0.2 }, 0)
      .fromTo(el, { x: 0 }, { x: 5, duration: 0.04, repeat: 3, yoyo: true, clearProps: 'x' }, 0)
      // svgOrigin: grow from the circles' own centre (0,0 in the viewBox); immediateRender off so each ripple stays hidden until its turn
      .fromTo(rip, { scale: 0.2, opacity: 1, svgOrigin: '0 0' }, { scale: 22, opacity: 0, svgOrigin: '0 0', duration: 1.2, stagger: 0.07, ease: 'power3.out', immediateRender: false }, 0)
      .fromTo(flash, { scale: 0, opacity: 0.95 }, { scale: 1, opacity: 0, duration: 0.5, ease: 'power2.out' }, 0);

    // 2 · boot with a glitch
    tl.set(power, { display: 'none' }, 0.7).set(boot, { display: 'grid' }, 0.7)
      .set(boot, { opacity: 1 }, 0.7);
    const burst = (t: number) => tl!.call(() => { sfx.crackle(); bios.classList.remove('glitch'); void bios.offsetWidth; bios.classList.add('glitch'); }, [], t);
    burst(0.75); burst(1.4);
    BIOS.forEach((line, i) => tl!.call(() => { bios.textContent += `${line}\n`; sfx.tick(); }, [], 0.78 + i * 0.12));
    tl.fromTo(logo, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 1.45)
      .call(() => sfx.chime(), [], 1.5)
      .to(bar, { scaleX: 1, duration: 0.55, ease: 'power1.inOut' }, 1.5);

    // 3 · auto login, then the Lobby pops in (no desktop, no arrows, no wave)
    tl.to(logo, { opacity: 0, duration: 0.15 }, 2.05)
      .fromTo(login, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' }, 2.05)
      .to(login, { opacity: 0, duration: 0.15 }, 2.4)
      .call(() => sfx.swish(), [], 2.45)
      .to(boot, { opacity: 0, duration: 0.2 }, 2.5)
      .to(el, { backgroundColor: 'transparent', duration: 0.01 }, 2.55)
      .fromTo('svg.floor', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 2.6);
    tl.add(() => lobbyIn(), 2.55).to(el, { opacity: 0, duration: 0.2 }, 3.1);
    tl.add(() => {}, 3.3);
    (window as unknown as { __introTl?: gsap.core.Timeline }).__introTl = tl; // handy for stepping through it in the console
  }
}

document.addEventListener('astro:page-load', () => {
  const el = document.getElementById('intro');
  if (el && root.dataset.intro === 'on') run(el);
  else if (document.querySelector('.lobby')) lobbyIn(0.05);
});

