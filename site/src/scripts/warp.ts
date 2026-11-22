// The Warp: Lobby → Portfolio (Enter) and menu → page (any a[data-warp]). A pastel wash grows as a circle from the clicked link,
// the page changes underneath, then the wash shrinks into the header logo. About 0.9 s. Plain link otherwise.
import { gsap } from 'gsap';
import { navigate } from 'astro:transitions/client';
import { reduced } from './motion';
import { playOnce, prefetch, SFX } from './audio';

prefetch(SFX.warp); // ~10 KB, so it plays the instant Enter or a menu page is clicked
let busy = false;
document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[data-warp]');
  if (!a || reduced() || busy || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || new URL(a.href).pathname === location.pathname) return;
  e.preventDefault();
  busy = true;
  const warp = document.querySelector<HTMLElement>('.warp');
  if (!warp) { busy = false; void navigate(a.href); return; }
  const wash = warp.querySelector<HTMLElement>('.wash')!;
  // grows from where the mouse clicked (a keyboard "click" has no position: use the link's centre)
  const r = a.getBoundingClientRect(), mouse = e.detail > 0 && (e.clientX || e.clientY);
  const cx = mouse ? e.clientX : r.left + r.width / 2, cy = mouse ? e.clientY : r.top + r.height / 2;
  const R = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
  warp.style.display = 'block';
  playOnce(SFX.warp, { duck: false });

  gsap.timeline()
    .fromTo(wash, { clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${R}px at ${cx}px ${cy}px)`, duration: 0.45, ease: 'power2.in' })
    .add(() => {
      // stay covered until the new page is in and drawn (two frames after page-load); 10 s only as a safety net
      const wait = new Promise<void>((res) => {
        document.addEventListener('astro:page-load', () => requestAnimationFrame(() => requestAnimationFrame(() => res())), { once: true });
        setTimeout(res, 10000);
      });
      void navigate(a.href);
      void wait.then(() => {
        // shrinks into the new page's tab in the header (the logo if there is none)
        const path = new URL(a.href).pathname, tab = document.querySelector<HTMLElement>(`.top .sections [data-nav="${path}"]`) ?? document.querySelector<HTMLElement>('.top .wordmark svg');
        const t = tab?.getBoundingClientRect(), tx = t ? t.left + t.width / 2 : 40, ty = t ? t.top + t.height / 2 : 30;
        const D = 0.4;
        gsap.to(wash, { clipPath: `circle(0px at ${tx}px ${ty}px)`, duration: D, ease: 'power3.inOut', onComplete: () => { warp.style.display = 'none'; busy = false; } });
        gsap.delayedCall(D - 0.1, () => document.dispatchEvent(new Event('jr:warp-out'))); // page rise-up starts 0.1 s before the wash is gone (fx.ts)
      });
    });
}, true); // capture: Astro's router also handles link clicks on document (and prevents them) before a bubbling listener would run
