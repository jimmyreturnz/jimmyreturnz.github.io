// BGM: one looping track that lives for the whole visit (Lobby and Portfolio). Plays once Sound is on (power button / Sound switch),
// quietly (music volume), starts when the Lobby appears (not during the Intro), pauses on demand from the header, and fades out while a chart
// song plays (`jr:feature-audio`), then back in. The header only shows the title and the Pause button.
import { tapBgm, normGain, BGM_LUFS } from './audio';

const cfg = document.querySelector<HTMLElement>('[data-bgm-cfg]');
if (cfg) {
  const el = new Audio(cfg.dataset.src); el.loop = true; el.preload = 'none'; el.volume = 0;
  const label = `BGM · ${cfg.dataset.name}`, norm = normGain(Number(cfg.dataset.lufs), BGM_LUFS);
  // Pause lasts for this visit only (sessionStorage): remembered forever, one old Pause silenced every later visit, and the Lobby has no button to undo it
  const store = { get: () => { try { return sessionStorage.getItem('jr.bgm') !== 'off'; } catch { return true; } }, set: (on: boolean) => { try { sessionStorage.setItem('jr.bgm', on ? 'on' : 'off'); } catch { /* private mode */ } } };
  try { localStorage.removeItem('jr.bgm'); } catch { /* the old, permanent setting */ }
  let want = store.get(), feature = false, lobby = false, raf = 0;
  const fadeTo = (v: number) => { // ~0.6 s linear fade on the element volume (1 = the normalised level); the music bus sets the real level
    v *= norm; cancelAnimationFrame(raf); const a = el.volume, t0 = performance.now();
    const f = (t: number) => { const p = Math.min(1, Math.max(0, (t - t0) / 600)); /* the first frame's timestamp can be a hair before t0 */ el.volume = a + (v - a) * p; if (p < 1) raf = requestAnimationFrame(f); else if (v === 0) el.pause(); };
    raf = requestAnimationFrame(f);
  };
  const soundOn = () => { try { return localStorage.getItem('jr.sound') === 'true'; } catch { return false; } };
  // held during the Intro and until 1 s after the Lobby has landed; Portfolio pages opened directly play straight away
  const introOn = () => !lobby && (document.documentElement.dataset.intro === 'on' || !!document.querySelector('.lobby'));
  const btn = () => document.querySelector<HTMLButtonElement>('[data-bgm-toggle]');
  const sync = () => {
    const b = btn(); if (b) { b.textContent = want ? 'Pause' : 'Play'; b.setAttribute('aria-pressed', String(!want)); }
    if (want && !feature && !introOn() && soundOn()) { tapBgm(el); void el.play().then(() => fadeTo(1)).catch(() => { /* needs a click first */ }); }
    else if (el.volume > 0 || !el.paused) fadeTo(0);
  };
  // the BGM pill (Lobby bar, and the Portfolio header kept across page changes) gets its title and button wired whenever it is on the page
  const bind = () => {
    const t = document.querySelector<HTMLElement>('[data-bgm-title]'), b = btn();
    if (t && !t.querySelector('.mq')) { t.innerHTML = `<span class="mq"><span>${label}</span><span aria-hidden="true">${label}</span></span>`; t.setAttribute('aria-label', label); } // two copies for the endless scroll
    if (b && !b.dataset.on) { b.dataset.on = '1'; b.addEventListener('click', () => { want = !want; store.set(want); sync(); }); }
    sync();
  };
  document.addEventListener('astro:page-load', bind);
  document.addEventListener('jr:sound', sync);
  let landing = 0; // the BGM comes in about 1 s after the Lobby lands (after the log-in chime)
  document.addEventListener('jr:lobby', () => { if (!lobby && !landing) landing = window.setTimeout(() => { lobby = true; sync(); }, 1000); });
  document.addEventListener('jr:feature-audio', (e) => { feature = (e as CustomEvent).detail.playing; sync(); });
  addEventListener('pointerdown', sync, { once: true }); // first click anywhere: browsers allow sound now
  addEventListener('keydown', sync, { once: true }); // keyboard visitors too
  bind();
}
