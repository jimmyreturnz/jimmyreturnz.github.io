// Theme (light default), Lite mode and Sound preference, remembered per browser.
type Key = 'theme' | 'lite' | 'sound';
const store = {
  get(k: Key): string | null { try { return localStorage.getItem(`jr.${k}`); } catch { return null; } },
  set(k: Key, v: string) { try { localStorage.setItem(`jr.${k}`, v); } catch { /* private mode */ } },
};

const root = document.documentElement;

function applyTheme(dark: boolean) {
  root.dataset.theme = dark ? 'dark' : 'light';
  document.querySelectorAll<HTMLElement>('[data-theme-switch]').forEach((b) => b.setAttribute('aria-checked', String(dark)));
}

function bindToggle(name: 'lite' | 'sound', onChange?: (on: boolean) => void) {
  const on = store.get(name) === 'true';
  if (name === 'lite') root.dataset.lite = String(on);
  document.querySelectorAll<HTMLElement>(`[data-setting="${name}"]`).forEach((b) => {
    b.setAttribute('aria-pressed', String(on));
    b.addEventListener('click', () => {
      const next = b.getAttribute('aria-pressed') !== 'true';
      document.querySelectorAll(`[data-setting="${name}"]`).forEach((x) => x.setAttribute('aria-pressed', String(next)));
      store.set(name, String(next));
      if (name === 'lite') root.dataset.lite = String(next);
      onChange?.(next);
    });
  });
}

applyTheme(store.get('theme') === 'dark');
document.querySelectorAll<HTMLElement>('[data-theme-switch]').forEach((b) =>
  b.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'dark';
    applyTheme(dark);
    store.set('theme', dark ? 'dark' : 'light');
  }),
);
bindToggle('lite');
bindToggle('sound', (on) => document.dispatchEvent(new CustomEvent('jr:sound', { detail: on })));
