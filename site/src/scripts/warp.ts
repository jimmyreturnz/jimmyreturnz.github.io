// The Warp: Lobby → Portfolio (Enter) and menu → page (any a[data-warp]). A pastel wash grows as a circle from the clicked link,
// the page changes underneath, then the wash shrinks into the header logo. About 0.9 s. Plain link otherwise.
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
  const wash = warp.querySelector<HTMLElement>('.wash')!;
  const r = a.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const R = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
  warp.style.display = 'block';
  sfx.swish();

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
        const t = document.querySelector<HTMLElement>('.top .wordmark svg')?.getBoundingClientRect();
        const tx = t ? t.left + t.width / 2 : 40, ty = t ? t.top + t.height / 2 : 30;
        gsap.to(wash, { clipPath: `circle(0px at ${tx}px ${ty}px)`, duration: 0.4, ease: 'power3.inOut', onComplete: () => { warp.style.display = 'none'; busy = false; } });
      });
    });
}, true); // capture: Astro's router also handles link clicks on document (and prevents them) before a bubbling listener would run
