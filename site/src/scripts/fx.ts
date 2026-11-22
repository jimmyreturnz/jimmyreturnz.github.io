// Small global effects: click squish + hearts, scroll reveals, nav-chip → page-title Flip, page loading bar.
// All of it is off under reduced motion (see motion.ts) and re-initialises on each Astro page change.
import { gsap } from 'gsap';
import { reduced } from './motion';
import { sfx, prefetch, SFX } from './audio';

const HEART = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" stroke="#1f1e33" stroke-width="1.6" stroke-linejoin="round" d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z"/></svg>';

prefetch(SFX.click); // 17 KB, so the first click already has its sound

// ---- click squish + 3–4 tiny hearts ----
document.addEventListener('pointerdown', (e) => {
  if (reduced()) return;
  const t = (e.target as Element | null)?.closest<HTMLElement>('.btn, .chip, .enter-btn, button:not([disabled]), [role="tab"]');
  if (!t || t.matches('[disabled], [aria-disabled="true"], input, [data-no-fx]')) return;
  gsap.fromTo(t, { scale: 0.92 }, { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
  if (!t.closest('[data-warp]')) sfx.click(); // Enter and menu pages play the warp sound instead
  for (let i = 0; i < 4; i++) {
    const h = document.createElement('span');
    h.innerHTML = HEART; h.setAttribute('aria-hidden', 'true');
    h.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;z-index:1000;pointer-events:none;color:var(--pink)`;
    document.body.append(h);
    gsap.fromTo(h, { x: 0, y: 0, scale: 0.6, rotate: gsap.utils.random(-20, 20) },
      { x: gsap.utils.random(-34, 34), y: gsap.utils.random(-46, -18), scale: gsap.utils.random(0.9, 1.4), opacity: 0, duration: gsap.utils.random(0.5, 0.8), ease: 'power2.out', onComplete: () => h.remove() });
  }
}, { passive: true });

// ---- nav chip → page title Flip (the clicked chip's box becomes the next page's h1) ----
let from: { x: number; y: number; w: number; h: number } | null = null;
document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest<HTMLElement>('[data-nav], [data-flip]');
  if (!a || reduced()) { from = null; return; }
  const r = a.getBoundingClientRect();
  from = { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}, true);

// While the Warp covers a page change, the new page waits (already in its start pose, under the wash) and rises only when
// the wash is nearly gone (`jr:warp-out`, 0.1 s before it ends); without a Warp it rises straight away.
const warpGate = (): Promise<void> => document.querySelector<HTMLElement>('.warp')?.style.display !== 'block' ? Promise.resolve()
  : new Promise((res) => { document.addEventListener('jr:warp-out', () => res(), { once: true }); setTimeout(res, 11000); });

function pageIn(gate: Promise<void>) {
  if (reduced()) return;
  const h1 = document.querySelector<HTMLElement>('.page-hero h1');
  if (h1 && from) {
    const r = h1.getBoundingClientRect(), f = from; from = null;
    const tw = gsap.from(h1, { x: f.x - (r.left + r.width / 2), y: f.y - (r.top + r.height / 2), scale: Math.min(1, f.w / r.width), opacity: 0.2, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity', paused: true });
    void gate.then(() => tw.play());
  }
  const hero = document.querySelector('.page-hero p');
  if (hero) { const tw = gsap.from(hero, { y: 16, opacity: 0, duration: 0.6, delay: 0.15, ease: 'power3.out', clearProps: 'all', paused: true }); void gate.then(() => tw.play()); }
}

// ---- scroll reveals: blocks rise and fade in once, with a small stagger ----
function reveals(gate: Promise<void>) {
  if (reduced()) return;
  const items = [...document.querySelectorAll<HTMLElement>('.page > *:not(.page-hero), .page .grid3 > *')];
  const seen = new Set<HTMLElement>();
  const io = new IntersectionObserver((es) => {
    const hit = es.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
    hit.forEach((el) => io.unobserve(el));
    if (hit.length) void gate.then(() => gsap.to(hit, { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity' }));
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  items.forEach((el) => { if (seen.has(el)) return; seen.add(el); gsap.set(el, { y: 26, opacity: 0 }); io.observe(el); });
}

// ---- heart loading bar for slow page changes ----
let bar: HTMLElement | null = null, timer = 0;
document.addEventListener('astro:before-preparation', () => {
  if (reduced()) return;
  timer = window.setTimeout(() => {
    bar ??= Object.assign(document.createElement('div'), { className: 'loadbar', ariaHidden: 'true', innerHTML: `<i></i><span>${HEART}</span>` });
    document.body.append(bar);
    gsap.fromTo(bar.querySelector('i'), { scaleX: 0 }, { scaleX: 0.85, duration: 2, ease: 'power2.out' });
    gsap.set(bar, { opacity: 1 });
  }, 150);
});
const done = () => {
  clearTimeout(timer);
  if (bar?.isConnected) gsap.to(bar.querySelector('i'), { scaleX: 1, duration: 0.2, onComplete: () => gsap.to(bar, { opacity: 0, duration: 0.2, onComplete: () => bar?.remove() }) });
};

let first = true;
document.addEventListener('astro:page-load', () => {
  done();
  const gate = warpGate();
  if (!first) pageIn(gate);
  first = false;
  if (!document.querySelector('.lobby')) reveals(gate);
});
