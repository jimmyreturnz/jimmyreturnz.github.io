// Shared audio: Web Audio synth for the Intro/UI sounds (no files needed yet), two remembered volumes
// (effects 70%, music 40%), a mute that follows the header Sound button, and an analyser for the visualizers.
// Browsers only allow sound after a click, so `unlock()` is called from the power button / any user gesture.
const store = {
  get: (k: string) => { try { return localStorage.getItem(`jr.${k}`); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(`jr.${k}`, v); } catch { /* private mode */ } },
};
export const vol = { sfx: Number(store.get('vol.sfx') ?? 0.7), music: Number(store.get('vol.music') ?? 0.7) };
/** Slider position -> gain. Squared, so the top of the slider is not 10x louder than the middle (a linear slider felt like a cliff). */
const curve = (v: number) => v * v;
/** Gain that brings a track of `lufs` loudness down to `target` LUFS (never boosts: element volume tops out at 1). */
export const normGain = (lufs: number, target: number) => (Number.isFinite(lufs) ? Math.min(1, 10 ** ((target - lufs) / 20)) : 1);
export const SONG_LUFS = -16, BGM_LUFS = -20; // songs a bit above the quiet BGM
let ctx: AudioContext | null = null, sfxBus: GainNode, musicBus: GainNode, songBus: GainNode, hitBus: GainNode, analyser: AnalyserNode;
const muted = () => store.get('sound') !== 'true';

export function unlock(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    sfxBus = ctx.createGain(); musicBus = ctx.createGain(); songBus = ctx.createGain(); hitBus = ctx.createGain(); analyser = ctx.createAnalyser();
    analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.45;
    // everything goes through a limiter first, so a loud file or a pile of hit sounds can never hit the speakers at full scale
    const out = ctx.createDynamicsCompressor(); out.threshold.value = -10; out.knee.value = 0; out.ratio.value = 20; out.attack.value = 0.003; out.release.value = 0.15;
    const master = ctx.createGain(); master.gain.value = 0.8; out.connect(master).connect(ctx.destination);
    sfxBus.connect(out); musicBus.connect(out); musicBus.connect(analyser); // the analyser only listens
    // chart songs and their hit sounds: the visitor pressed play, so the Sound button's mute doesn't silence them; the volume sliders do
    songBus.connect(out); songBus.connect(analyser); hitBus.connect(out);
    apply();
  }
  void ctx.resume();
  return ctx;
}
function apply() {
  if (!ctx) return;
  const m = muted();
  sfxBus.gain.value = m ? 0 : curve(vol.sfx); musicBus.gain.value = m ? 0 : curve(vol.music);
  songBus.gain.value = curve(vol.music); hitBus.gain.value = curve(vol.sfx) * 0.6; // the taiko hit samples peak at full scale
}
export function setVolume(kind: 'sfx' | 'music', v: number) { vol[kind] = v; store.set(`vol.${kind}`, String(v)); apply(); }
export function setSound(on: boolean) { store.set('sound', String(on)); apply(); document.dispatchEvent(new CustomEvent('jr:sound', { detail: on })); }
document.addEventListener('jr:sound', apply);

/** Let the visualizers listen to an <audio> element (a chart song) without changing how it sounds. */
export function tap(el: HTMLAudioElement) {
  if (el.dataset.tapped) return;
  const c = unlock(); el.dataset.tapped = '1';
  const s = c.createMediaElementSource(el);
  s.connect(songBus);
}

/** BGM goes through the music bus, so the header Sound button mutes it and the music slider sets its level. */
export function tapBgm(el: HTMLAudioElement) {
  // unlock() also resumes the context: one made before any click starts suspended, and the BGM would play into silence
  const c = unlock();
  if (el.dataset.tapped) return;
  el.dataset.tapped = '1';
  c.createMediaElementSource(el).connect(musicBus);
}

// taiko hit sounds (owner's skin samples, kept as WAV so they land on time), decoded once, played on the effects volume
const HIT_FILE: Record<string, string> = { normal: 'taiko-don', clap: 'taiko-kat', finish: 'taiko-finish', whistle: 'taiko-whistle' };
const buffers: Record<string, AudioBuffer> = {};
export async function loadHits() {
  const c = unlock();
  await Promise.all(Object.entries(HIT_FILE).map(async ([n, file]) => {
    if (buffers[n]) return;
    try { buffers[n] = await c.decodeAudioData(await (await fetch(`/sfx/${file}.wav`)).arrayBuffer()); } catch { /* missing file: stay silent */ }
  }));
}
export function hit(names: string[]) {
  if (!ctx) return;
  for (const n of names) { const b = buffers[n]; if (!b) continue; const s = ctx.createBufferSource(); s.buffer = b; s.connect(hitBus); s.start(); }
}

/** 0..1 levels for `n` bars from the real music (punchy: bass-weighted, boosted); all zero when nothing plays, so the visualizers vanish. */
export function levels(n: number): number[] {
  if (!ctx) return Array(n).fill(0);
  const d = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(d);
  return Array.from({ length: n }, (_, i) => {
    const lo = Math.floor(Math.pow(i / n, 1.7) * d.length * 0.75), hi = Math.max(lo + 1, Math.floor(Math.pow((i + 1) / n, 1.7) * d.length * 0.75));
    let m = 0; for (let k = lo; k < hi; k++) m = Math.max(m, d[k]!);
    return m > 8 ? Math.min(1, Math.pow(m / 255, 1.5) * 1.7) : 0;
  });
}

// --- generated effects (placeholders until the owner picks real SFX) ---
function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.25, slideTo?: number, at = 0) {
  if (!ctx || muted()) return;
  const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(sfxBus); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur: number, gain = 0.15, at = 0, hp = 1500) {
  if (!ctx || muted()) return;
  const t = ctx.currentTime + at, len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = buf; f.type = 'highpass'; f.frequency.value = hp; g.gain.value = gain;
  s.connect(f).connect(g).connect(sfxBus); s.start(t);
}
// sound files in assets/sfx/: each fetched once (when first asked for) and decoded once
export const SFX = { hold: '/sfx/intro-hold.m4a', boom: '/sfx/intro-boom.mp3', loading: '/sfx/intro-loading.m4a', welcome: '/sfx/lobby-welcome.m4a', error: '/sfx/error.m4a', click: '/sfx/ui-click.wav', warp: '/sfx/warp.mp3' } as const;
const fileBytes = new Map<string, Promise<ArrayBuffer>>(), fileBufs = new Map<string, Promise<AudioBuffer | null>>();
/** Start downloading sound files now so they're ready when played (no sound context needed yet). */
export function prefetch(...urls: string[]) { for (const u of urls) if (!fileBytes.has(u)) fileBytes.set(u, fetch(u).then((r) => (r.ok ? r.arrayBuffer() : new ArrayBuffer(0))).catch(() => new ArrayBuffer(0))); }
function fileBuffer(url: string) {
  prefetch(url);
  let p = fileBufs.get(url);
  if (!p) { const c = unlock(); p = fileBytes.get(url)!.then((b) => (b.byteLength ? c.decodeAudioData(b) : null)).catch(() => null); fileBufs.set(url, p); }
  return p;
}

/** Play a sound file once on the effects volume; returns a function that stops it. `duck` fades the BGM out while it plays
 *  (`jr:feature-audio`). Before any click the browser may still allow sound (sites visited often); if it doesn't, `wait` plays
 *  it on the first click/key instead, otherwise it is skipped. */
export function playOnce(url: string, { duck = true, wait = true } = {}) {
  let src: AudioBufferSourceNode | null = null, stopped = false, once: (() => void) | null = null;
  const tell = (playing: boolean) => duck && document.dispatchEvent(new CustomEvent('jr:feature-audio', { detail: { playing, id: url } }));
  const stop = () => {
    stopped = true;
    if (once) { removeEventListener('pointerdown', once); removeEventListener('keydown', once); }
    if (src) { src.onended = null; try { src.stop(); } catch { /* not started */ } tell(false); src = null; }
  };
  if (muted()) return stop;
  const go = async () => {
    const buf = await fileBuffer(url); if (!buf || muted() || stopped) return;
    const c = unlock(), s = c.createBufferSource(); s.buffer = buf; s.connect(sfxBus);
    s.onended = () => { tell(false); src = null; }; tell(true); s.start(); src = s;
  };
  const later = () => { if (!wait || stopped) return; once = () => { stop(); stopped = false; void go(); }; addEventListener('pointerdown', once); addEventListener('keydown', once); };
  if (navigator.userActivation?.hasBeenActive ?? true) void go();
  else {
    const c = unlock(); // the browser may allow it anyway: resume settles quickly either way
    void Promise.race([c.resume(), new Promise((r) => setTimeout(r, 300))]).then(() => (c.state === 'running' ? go() : later()));
  }
  return stop;
}

export const sfx = {
  /** The hold sound, starting at the press and following the hold: if decoding takes a moment it starts that far in,
   *  and `stop(fade)` cuts it where the hold ended (a short fade on release, a longer one when the hold completes). */
  hum() {
    if (!ctx || muted()) return (_fade?: number) => {};
    const c = ctx, t0 = c.currentTime, g = c.createGain(); g.connect(sfxBus);
    let src: AudioBufferSourceNode | null = null, stopped = false;
    void fileBuffer(SFX.boom); // decode the boom now too, so it lands exactly on the burst
    void fileBuffer(SFX.hold).then((buf) => {
      if (!buf || stopped) return;
      const at = c.currentTime - t0; if (at >= buf.duration) return;
      src = c.createBufferSource(); src.buffer = buf; src.connect(g); src.start(0, at);
    });
    return (fade = 0.04) => {
      stopped = true; const t = c.currentTime;
      g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + fade); src?.stop(t + fade + 0.02);
    };
  },
  chime() { tone(659, 0.5, 'triangle', 0.2); tone(988, 0.7, 'triangle', 0.18, undefined, 0.12); tone(1318, 0.9, 'sine', 0.12, undefined, 0.24); },
  crackle() { noise(0.12, 0.18, 0, 800); },
  tick() { tone(1800, 0.03, 'square', 0.05); },
  pop() { tone(520, 0.09, 'sine', 0.22, 900); },
  swish() { noise(0.3, 0.07, 0, 3000); tone(300, 0.3, 'sine', 0.06, 1200); },
  shimmer() { [880, 1175, 1568, 2093].forEach((f, i) => tone(f, 0.6, 'sine', 0.08, undefined, i * 0.07)); },
  /** Button click (assets/sfx/ui-click.wav, WAV so it plays without a delay). Called from a pointerdown, so sound is allowed. */
  click() {
    if (muted()) return;
    const c = unlock();
    void fileBuffer(SFX.click).then((b) => { if (!b) return; const s = c.createBufferSource(); s.buffer = b; s.connect(sfxBus); s.start(); });
  },
};
