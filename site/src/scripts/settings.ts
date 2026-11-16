// Theme (light default) and Sound preference, remembered per browser.
// Uses event delegation so it keeps working across client-side page changes (Astro ClientRouter).
type Key = 'theme' | 'sound';
const store = {
  get(k: Key): string | null { try { return localStorage.getItem(`jr.${k}`); } catch { return null; } },
  set(k: Key, v: string) { try { localStorage.setItem(`jr.${k}`, v); } catch { /* private mode */ } },
};
const root = document.documentElement;

function syncControls() {
  const dark = store.get('theme') === 'dark';
  root.dataset.theme = dark ? 'dark' : 'light';
  document.querySelectorAll('[data-theme-switch]').forEach((b) => b.setAttribute('aria-checked', String(dark)));
  const sound = store.get('sound') === 'true';
  document.querySelectorAll('[data-setting="sound"]').forEach((b) => b.setAttribute('aria-pressed', String(sound)));
}

document.addEventListener('click', (e) => {
  const t = e.target as Element | null;
  if (t?.closest('[data-theme-switch]')) {
    store.set('theme', root.dataset.theme === 'dark' ? 'light' : 'dark');
    syncControls();
  } else if (t?.closest('[data-setting="sound"]')) {
    const next = store.get('sound') !== 'true';
    store.set('sound', String(next));
    syncControls();
    document.dispatchEvent(new CustomEvent('jr:sound', { detail: next }));
  }
});

// The new page's <html> replaces ours on navigation, so re-apply before it paints.
document.addEventListener('astro:after-swap', syncControls);
document.addEventListener('astro:page-load', syncControls);
syncControls();
