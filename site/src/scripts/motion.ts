// Motion preference. Full motion for everyone by default, even with the OS "reduce motion" setting on (owner, 2026-11-23).
// `?motion=system` opts this browser back into following the OS setting (remembered); `?motion=full` undoes that.
const KEY = 'jr.motion';
const get = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const q = new URLSearchParams(location.search).get('motion');
if (q === 'full' || q === 'system') { try { q === 'system' ? localStorage.setItem(KEY, 'system') : localStorage.removeItem(KEY); } catch { /* private mode */ } }
export const full = () => get() !== 'system';
export const reduced = () => !full() && matchMedia('(prefers-reduced-motion: reduce)').matches;
const mark = () => { document.documentElement.dataset.motion = full() ? 'full' : 'system'; };
mark();
// page changes copy the new page's <html> attributes over ours, which dropped this one: CSS animations stopped after the first click
document.addEventListener('astro:after-swap', mark);
