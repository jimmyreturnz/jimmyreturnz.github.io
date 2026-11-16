// Motion preference. The OS "reduce motion" setting turns the animation pass off; the owner can force it on while
// tinkering with `?motion=full` (remembered) and back with `?motion=system`.
const KEY = 'jr.motion';
const get = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const q = new URLSearchParams(location.search).get('motion');
if (q === 'full' || q === 'system') { try { q === 'full' ? localStorage.setItem(KEY, 'full') : localStorage.removeItem(KEY); } catch { /* private mode */ } }
export const full = () => get() === 'full';
export const reduced = () => !full() && matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.dataset.motion = full() ? 'full' : 'system';
