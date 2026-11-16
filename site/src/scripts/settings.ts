// Theme (light default) and Sound preference, remembered per browser.
// Uses event delegation so it keeps working across client-side page changes (Astro ClientRouter).
type Key = 'theme' | 'sound';
const store = {
  get(k: Key): string | null { try { return localStorage.getItem(`jr.${k}`); } catch { return null; } },
  set(k: Key, v: string) { try { localStorage.setItem(`jr.${k}`, v); } catch { /* private mode */ } },
};
import { reduced } from './motion';
import { setSound, unlock } from './audio';
const root = document.documentElement;

function syncControls() {
  const dark = store.get('theme') === 'dark';
  root.dataset.theme = dark ? 'dark' : 'light';
  document.querySelectorAll('[data-theme-switch]').forEach((b) => b.setAttribute('aria-checked', String(dark)));
  const sound = store.get('sound') === 'true';
  document.querySelectorAll('[data-setting="sound"]').forEach((b) => b.setAttribute('aria-pressed', String(sound)));
}

document.addEventListener('click', (e) => {
  const t = (e.target as Element | null)?.closest<HTMLElement>('[data-theme-switch], [data-setting="sound"]');
  if (!t) return;
  if (t.matches('[data-theme-switch]')) {
    const flip = () => { store.set('theme', root.dataset.theme === 'dark' ? 'light' : 'dark'); syncControls(); };
    if (reduced() || !('startViewTransition' in document)) return flip();
    // circular reveal growing out of the switch
    const r = t.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.dataset.vt = 'theme';
    const vt = (document as Document & { startViewTransition: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } }).startViewTransition(flip);
    void vt.ready.then(() => root.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] }, { duration: 650, easing: 'ease-out', pseudoElement: '::view-transition-new(root)' }));
    void vt.finished.finally(() => delete root.dataset.vt);
  } else {
    const next = store.get('sound') !== 'true';
    if (next) unlock();
    setSound(next);
    syncControls();
  }
});

// The new page's <html> replaces ours on navigation, so re-apply before it paints.
document.addEventListener('astro:after-swap', syncControls);
document.addEventListener('astro:page-load', syncControls);
document.addEventListener('jr:sound', syncControls);
syncControls();
