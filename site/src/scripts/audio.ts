// Shared audio: Web Audio synth for the Intro/UI sounds (no files needed yet), two remembered volumes
// (effects 70%, music 40%), a mute that follows the header Sound button, and an analyser for the visualizers.
// Browsers only allow sound after a click, so `unlock()` is called from the power button / any user gesture.
const store = {
  get: (k: string) => { try { return localStorage.getItem(`jr.${k}`); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(`jr.${k}`, v); } catch { /* private mode */ } },
};
export const vol = { sfx: Number(store.get('vol.sfx') ?? 0.7), music: Number(store.get('vol.music') ?? 0.4) };
let ctx: AudioContext | null = null, sfxBus: GainNode, musicBus: GainNode, analyser: AnalyserNode;
const muted = () => store.get('sound') !== 'true';

export function unlock(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    sfxBus = ctx.createGain(); musicBus = ctx.createGain(); analyser = ctx.createAnalyser();
    analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.45;
    sfxBus.connect(ctx.destination); musicBus.connect(ctx.destination); musicBus.connect(analyser); // the analyser only listens
    apply();
  }
  void ctx.resume();
  return ctx;
}
function apply() {
  if (!ctx) return;
  const m = muted();
  sfxBus.gain.value = m ? 0 : vol.sfx; musicBus.gain.value = m ? 0 : vol.music;
}
export function setVolume(kind: 'sfx' | 'music', v: number) { vol[kind] = v; store.set(`vol.${kind}`, String(v)); apply(); }
export function setSound(on: boolean) { store.set('sound', String(on)); apply(); document.dispatchEvent(new CustomEvent('jr:sound', { detail: on })); }
document.addEventListener('jr:sound', apply);

/** Let the visualizers listen to an <audio> element (a chart song) without changing how it sounds. */
export function tap(el: HTMLAudioElement) {
  if (el.dataset.tapped) return;
  const c = unlock(); el.dataset.tapped = '1';
  const s = c.createMediaElementSource(el);
  s.connect(c.destination); s.connect(analyser);
}

/** Is anything audible going through the analyser right now? */
export function hasSignal(): boolean {
  if (!ctx) return false;
  const d = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(d);
  return d.some((x) => x > 8);
}

/** 0..1 levels for `n` bars: the real music (punchy: bass-weighted, boosted) when something plays, else a beating synthetic wave. */
export function levels(n: number, t: number, live = true): number[] {
  if (live && ctx) {
    const d = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(d);
    if (d.some((x) => x > 8)) {
      return Array.from({ length: n }, (_, i) => {
        const lo = Math.floor(Math.pow(i / n, 1.7) * d.length * 0.75), hi = Math.max(lo + 1, Math.floor(Math.pow((i + 1) / n, 1.7) * d.length * 0.75));
        let m = 0; for (let k = lo; k < hi; k++) m = Math.max(m, d[k]!);
        return Math.min(1, Math.pow(m / 255, 1.5) * 1.7);
      });
    }
  }
  const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2.4)), 5); // ~144 bpm kick
  return Array.from({ length: n }, (_, i) => Math.min(1, 0.14 + 0.62 * beat * (1 - (i / n) * 0.6) + 0.18 * Math.abs(Math.sin(t * 3.1 + i * 0.7))));
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
