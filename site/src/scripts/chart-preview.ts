import { tap } from './audio';
// Song preview + seek slider for chart players.
// - Nothing loads until the visitor presses play (audio is preload="none").
// - Only one chart plays at a time; switching 4K/7K or leaving the page pauses it.
// - Emits `jr:feature-audio` ({ playing, id }) so the BGM can crossfade, and `jr:chart-time` (seconds)
//   on each player so the note renderer (animation pass) can follow the slider.

const mmss = (t: number) => {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const allAudio = () => [...document.querySelectorAll<HTMLAudioElement>('[data-chart] audio[data-audio]')];
const pauseAll = (except?: HTMLAudioElement) => allAudio().forEach((a) => { if (a !== except && !a.paused) a.pause(); });

function setup(root: HTMLElement) {
  if (root.dataset.previewReady) return;
  root.dataset.previewReady = 'true';
  const id = root.dataset.chart!;
  const audio = root.querySelector<HTMLAudioElement>('audio[data-audio]');
  const seek = root.querySelector<HTMLInputElement>('input[data-seek]')!;
  const out = root.querySelector<HTMLOutputElement>('[data-time]')!;
  const pp = root.querySelector<HTMLButtonElement>('[data-pp]')!;

  let dragging = false;
  const render = (t: number) => {
    seek.value = String(t);
    const text = `${mmss(t)} / ${mmss(Number(seek.max))}`;
    out.textContent = text;
    seek.setAttribute('aria-valuetext', text);
    root.dispatchEvent(new CustomEvent('jr:chart-time', { detail: t }));
  };
  render(0);
  if (!audio) return;

  const seekTo = (t: number) => {
    const clamped = Math.min(Math.max(0, t), Number(seek.max));
    audio.currentTime = clamped;
    render(clamped);
  };

  let raf = 0;
  const tick = () => { if (!dragging) render(audio.currentTime); raf = requestAnimationFrame(tick); };

  audio.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audio.duration)) seek.max = String(audio.duration);
    render(audio.currentTime);
  });
  audio.addEventListener('play', () => {
    tap(audio); // the visualizers listen to the song
    pp.setAttribute('aria-pressed', 'true');
    pp.querySelector('.sr-only')!.textContent = 'Pause preview';
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    document.dispatchEvent(new CustomEvent('jr:feature-audio', { detail: { playing: true, id } }));
  });
  const stopped = () => {
    pp.setAttribute('aria-pressed', 'false');
    pp.querySelector('.sr-only')!.textContent = 'Play preview';
    cancelAnimationFrame(raf);
    render(audio.currentTime);
    document.dispatchEvent(new CustomEvent('jr:feature-audio', { detail: { playing: false, id } }));
  };
  audio.addEventListener('pause', stopped);
  audio.addEventListener('ended', stopped);

  pp.addEventListener('click', () => {
    if (audio.paused) { pauseAll(audio); void audio.play(); } else audio.pause();
  });

  // Dragging shows the target time; the song jumps when released.
  seek.addEventListener('input', () => { dragging = true; render(Number(seek.value)); });
  seek.addEventListener('change', () => { dragging = false; seekTo(Number(seek.value)); });

  // Bigger keyboard steps than the 0.1 s slider step.
  seek.addEventListener('keydown', (e) => {
    const jumps: Record<string, number> = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -15, PageUp: 15 };
    if (e.key in jumps) { e.preventDefault(); seekTo(Number(seek.value) + jumps[e.key]!); }
    else if (e.key === 'Home') { e.preventDefault(); seekTo(0); }
    else if (e.key === 'End') { e.preventDefault(); seekTo(Number(seek.max) - 0.1); }
  });
}

document.addEventListener('astro:page-load', () => document.querySelectorAll<HTMLElement>('[data-chart]').forEach(setup));
// Switching key mode hides the other chart: stop whatever was playing.
document.addEventListener('click', (e) => { if ((e.target as Element | null)?.closest('[data-keys-btn]')) pauseAll(); });
// A removed <audio> can keep playing after a client-side page change, so stop everything first.
document.addEventListener('astro:before-swap', () => pauseAll());
