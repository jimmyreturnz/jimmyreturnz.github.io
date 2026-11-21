// BGM: one looping track in the persistent header. Plays once Sound is on (power button / Sound switch), quietly (music volume),
// pauses on demand, and fades out while a chart song plays (`jr:feature-audio`), then back in.
import { tapBgm } from './audio';

const box = document.querySelector<HTMLElement>('[data-bgm-src]');
if (box) {
  const el = new Audio(box.dataset.bgmSrc); el.loop = true; el.preload = 'none'; el.volume = 0;
  const btn = box.querySelector<HTMLButtonElement>('[data-bgm-toggle]')!;
  box.querySelector('[data-bgm-title]')!.textContent = `BGM · ${box.dataset.bgmName}`;
  const store = { get: () => { try { return localStorage.getItem('jr.bgm') !== 'off'; } catch { return true; } }, set: (on: boolean) => { try { localStorage.setItem('jr.bgm', on ? 'on' : 'off'); } catch { /* private mode */ } } };
  let want = store.get(), feature = false, raf = 0;
  const fadeTo = (v: number) => { // ~0.6 s linear fade on the element volume; the music bus sets the real level
    cancelAnimationFrame(raf); const a = el.volume, t0 = performance.now();
    const f = (t: number) => { const p = Math.min(1, (t - t0) / 600); el.volume = a + (v - a) * p; if (p < 1) raf = requestAnimationFrame(f); else if (v === 0) el.pause(); };
    raf = requestAnimationFrame(f);
  };
  const soundOn = () => { try { return localStorage.getItem('jr.sound') === 'true'; } catch { return false; } };
  const sync = () => {
    btn.textContent = want ? 'Pause' : 'Play'; btn.setAttribute('aria-pressed', String(!want));
    if (want && !feature && soundOn()) { tapBgm(el); void el.play().then(() => fadeTo(1)).catch(() => { /* needs a click first */ }); }
    else if (el.volume > 0 || !el.paused) fadeTo(0);
  };
  btn.addEventListener('click', () => { want = !want; store.set(want); sync(); });
  document.addEventListener('jr:sound', sync);
  document.addEventListener('jr:feature-audio', (e) => { feature = (e as CustomEvent).detail.playing; sync(); });
  addEventListener('pointerdown', sync, { once: true }); // first click anywhere: browsers allow sound now
  sync();
}
