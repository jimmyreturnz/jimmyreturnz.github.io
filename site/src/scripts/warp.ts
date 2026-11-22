// The Warp: Lobby → Portfolio (Enter) and menu → page (any a[data-warp]). Ripples from the clicked link, a pink wash, hearts and arrows streaking at -35°,
// then the wash shrinks into the header logo. About 0.9 s; flashes stay under 3 per second. Plain link otherwise.
import { gsap } from 'gsap';
import { navigate } from 'astro:transitions/client';
import { reduced } from './motion';
import { sfx } from './audio';

let busy = false;
document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[data-warp]');
  if (!a || reduced() || busy || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || new URL(a.href).pathname === location.pathname) return;
  e.preventDefault();
  busy = true;
  const warp = document.querySelector<HTMLElement>('.warp');
  if (!warp) { busy = false; void navigate(a.href); return; }
  const wash = warp.querySelector<HTMLElement>('.wash')!, rings = [...warp.querySelectorAll<SVGCircleElement>('.wr circle')], bits = [...warp.querySelectorAll<SVGElement>(':scope > .vh')];
  const r = a.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, w = innerWidth, h = innerHeight;
  const R = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
  const ang = Math.atan2(-h, w) * (180 / Math.PI);
  warp.style.display = 'block';
  rings.forEach((c) => { c.setAttribute('cx', String(cx)); c.setAttribute('cy', String(cy)); });
  sfx.boom(); sfx.swish();

  const tl = gsap.timeline();
  tl.fromTo(rings, { scale: 0.3, opacity: 0.9 }, { scale: 28, opacity: 0, duration: 0.7, stagger: 0.07, ease: 'power2.out' }, 0)
    .fromTo(wash, { clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${R}px at ${cx}px ${cy}px)`, duration: 0.45, ease: 'power2.in' }, 0.05)
    .fromTo(bits, { x: (i) => -200 + i * 40, y: (i) => h + 40 - i * 60, rotation: (i) => (i < 2 ? ang : 0), opacity: 1 },
      { x: (i) => w + 60 - i * 80, y: (i) => -160 + i * 120, duration: 0.7, stagger: 0.07, ease: 'power2.inOut' }, 0.1)
    .add(() => {
      const wait = new Promise<void>((res) => { document.addEventListener('astro:page-load', () => res(), { once: true }); setTimeout(res, 3000); });
      void navigate(a.href);
      void wait.then(() => {
        const t = document.querySelector<HTMLElement>('.top .wordmark svg')?.getBoundingClientRect();
        const tx = t ? t.left + t.width / 2 : 40, ty = t ? t.top + t.height / 2 : 30;
        gsap.timeline({ onComplete: () => { warp.style.display = 'none'; bits.forEach((b) => gsap.set(b, { opacity: 0 })); busy = false; } })
          .to(wash, { clipPath: `circle(0px at ${tx}px ${ty}px)`, duration: 0.4, ease: 'power3.inOut' });
      });
    }, 0.5);
}, true); // capture: Astro's router also handles link clicks on document (and prevents them) before a bubbling listener would run
