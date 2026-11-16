# Portfolio — feature list

Living list of what the site should contain. Order = rough page order.

## Flow
1. **Intro animation** — game-like, plays on first visit only (remember in localStorage; skippable).
2. **Profile** → **Info** cards.
3. **"Enter portfolio" button** → transition animation that morphs into the portfolio page. *(animation + sound TBD)*

## Inside the portfolio
- **Background music** at low volume. Crossfades out when any feature below plays audio, and back in when it stops.
- **osu!mania 4K** — chart preview with song + playable chart. Chart: かめりあ – Quaoar (own map, 4K). Audio controls, **muted by default**. Layout reference: kenzync.dev tool cards.
- **osu!taiko** — chart preview with hitsounds + playable chart. Chart: DJ SHARPNEL – THE POWER OF UNDERGROUND (own map).
- **TETR.IO** — looping gameplay video (already recorded).
- **Projects** — GitHub repos, internship and career work, each linking out.
- **LinkedIn** link/card.
- **Shoutouts** — friends' usernames and people I respect, with optional avatar, link and a short quote/message each. Editable as content (not hard-coded) so entries can be added any time.
- **Content board / blog** — write, edit, add images like a blogger (Sveltia CMS). Features to be requested later.

## Global requirements
- Pastel **vectorheart** theme — element kit in `assets/vectorheart/`, fonts in `assets/fonts/`.
- Heavy animation, but smooth (60fps target) and **mobile-friendly**; respect `prefers-reduced-motion`.

## Open questions
- Song licensing: full tracks vs short preview clips for Quaoar / THE POWER OF UNDERGROUND.
- NuageRose font (Gumroad, free) — owner to download and add to `assets/fonts/nuagerose/` with its license.
