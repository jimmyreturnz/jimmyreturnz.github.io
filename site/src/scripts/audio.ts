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

// taiko hit sounds (owner's skin samples in assets/sfx/), decoded once, played on the effects volume
const buffers: Record<string, AudioBuffer> = {};
export async function loadHits() {
  const c = unlock();
  await Promise.all(['normal', 'clap', 'finish', 'whistle'].map(async (n) => {
    if (buffers[n]) return;
    try { buffers[n] = await c.decodeAudioData(await (await fetch(`/sfx/taiko-normal-hit${n}.wav`)).arrayBuffer()); } catch { /* missing file: stay silent */ }
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
export const sfx = {
  /** rising hum while the power button is held; call `stop()` on the result. */
  hum() {
    if (!ctx || muted()) return () => {};
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(260, t + 0.7);
    g.gain.value = 0.06; o.connect(g).connect(sfxBus); o.start();
    return () => { g.gain.setTargetAtTime(0, ctx!.currentTime, 0.03); o.stop(ctx!.currentTime + 0.15); };
  },
  boom() { tone(90, 0.5, 'sine', 0.5, 40); noise(0.25, 0.12, 0, 600); },
  chime() { tone(659, 0.5, 'triangle', 0.2); tone(988, 0.7, 'triangle', 0.18, undefined, 0.12); tone(1318, 0.9, 'sine', 0.12, undefined, 0.24); },
  crackle() { noise(0.12, 0.18, 0, 800); },
  tick() { tone(1800, 0.03, 'square', 0.05); },
  pop() { tone(520, 0.09, 'sine', 0.22, 900); },
  swish() { noise(0.3, 0.07, 0, 3000); tone(300, 0.3, 'sine', 0.06, 1200); },
  shimmer() { [880, 1175, 1568, 2093].forEach((f, i) => tone(f, 0.6, 'sine', 0.08, undefined, i * 0.07)); },
  click() { tone(700, 0.05, 'sine', 0.12, 400); },
};
