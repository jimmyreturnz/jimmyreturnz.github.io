// Odometer numbers: every digit is a column that scrolls to its value (docs/FEATURES.md → "Rolling numbers").
// Mark a number with `data-roll`. Numbers in a tab or key-mode panel roll when `rollIn(panel)` is called (stacked panels
// stay rendered, so visibility observers can't see a switch); other numbers roll once when scrolled into view. For a value that changes in place, call `rollTo(el, '1,234')` and it rolls from the old digits.
import { gsap } from 'gsap';
import { reduced } from './motion';

const DURATION = 0.8, STAGGER = 0.06;
const isDigit = (c: string) => c >= '0' && c <= '9';
const ONE_TO_NINE = '0123456789';

const tweens = new WeakMap<HTMLElement, gsap.core.Timeline>();

export function rollTo(el: HTMLElement, to: string, from: string = el.dataset.rv ?? ''): void {
  tweens.get(el)?.kill();
  el.dataset.rv = to;
  if (reduced() || !/\d/.test(to) || from === to && el.dataset.rolled) { el.textContent = to; return; }
  el.dataset.rolled = '1';
  el.setAttribute('aria-label', to);
  const cols: { col: HTMLElement; d: number; d0: number }[] = [];
  const nodes = [...to].map((c, i) => {
    if (!isDigit(c)) { const s = document.createElement('span'); s.setAttribute('aria-hidden', 'true'); s.textContent = c; return s; }
    const fc = from[from.length - (to.length - i)]; // the old character in the same place from the right
    const col = document.createElement('span');
    col.className = 'rc'; col.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span'); inner.className = 'rc-i';
    for (const n of ONE_TO_NINE) { const r = document.createElement('span'); r.textContent = n; inner.append(r); }
    col.append(inner);
    cols.push({ col: inner, d: Number(c), d0: fc && isDigit(fc) ? Number(fc) : 0 });
    return col;
  });
  el.replaceChildren(...nodes);
  const tl = gsap.timeline({ onComplete: () => { el.textContent = to; el.removeAttribute('aria-label'); } });
  cols.forEach(({ col, d, d0 }, i) => tl.fromTo(col, { yPercent: -d0 * 10 }, { yPercent: -d * 10, duration: DURATION, ease: 'power3.out' }, (cols.length - 1 - i) * STAGGER));
  tweens.set(el, tl);
}

/** Roll every `[data-roll]` number inside `root` up from zero (call when a tab or key-mode panel is shown). */
export function rollIn(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-roll]').forEach((el) => {
    if (el.querySelector('.ph')) return; // striped placeholder: nothing to roll
    el.dataset.rv ??= el.textContent ?? '';
    rollTo(el, el.dataset.rv, '');
  });
}

/** Numbers that are not inside a tab/key panel roll once, the first time they scroll into view. */
export function watchRolls(root: ParentNode = document): void {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    rollIn(e.target.parentElement!);
  }), { threshold: 0.6 });
  root.querySelectorAll<HTMLElement>('[data-roll]').forEach((el) => {
    el.dataset.rv = el.textContent ?? '';
    if (!el.closest('[role="tabpanel"], [data-keys-panel]')) io.observe(el);
  });
}
