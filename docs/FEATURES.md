# Portfolio — feature list

Living list of what the site should contain. Order = rough page order.

## Flow
1. **Intro animation** — game-like, plays on first visit only (remember in localStorage; skippable).
2. **Profile** → **Info** cards.
3. **"Enter portfolio" button** → transition animation that morphs into the portfolio page. *(animation + sound TBD)*

## Inside the portfolio
Showcase order: Projects → osu!taiko → osu!mania → TETR.IO → Skills and Setups → Timeline → Blog → Shoutouts → Guestbook → footer (LinkedIn, GitHub, Instagram, Facebook, work email).

- **Background music** at low volume. Crossfades out when any feature below plays audio, and back in when it stops.
- **osu!mania 4K** — chart preview with song + playable chart. Chart: かめりあ – Quaoar (own map, 4K). Audio controls, **muted by default**. Layout reference: kenzync.dev tool cards.
- **osu!taiko** — chart preview with hitsounds + playable chart. Chart: Camellia – Circles of Death, own map (https://osu.ppy.sh/beatmapsets/2404655#taiko/5216517).
- **TETR.IO** — looping gameplay video (already recorded).
- **Projects** — GitHub repos, internship and career work, each linking out.
- **LinkedIn** link/card.
- **Shoutouts** — friends' usernames and people I respect, with optional avatar, link and a short quote/message each. Editable as content (not hard-coded) so entries can be added any time.
- **Skills and Setups** — tech skills plus gaming gear and settings.
- **Timeline** — high school, university, internship, career only; secondary, not a main focus.
- **Stats Cards** — osu!, TETR.IO, GitHub; refreshed daily. Compact player card in the Lobby (TBD after mockup); each links to the matching profile.
- **Guestbook** — TH / EN / JP with cute fonts. Approve-before-publish. Optional osu!/TETR.IO username with hover profile card + click-through. No accounts: per-visitor limits by salted IP hash (1 pending, 1 post/day); guests without a game username show a plain name tag. Paginated from day one: 20 messages per page, newest first. Game-username verification: TBD (see storyboard).
- **Night theme** — switch design coming from owner.
- **Content board / blog** — write, edit, add images like a blogger (Sveltia CMS). Features to be requested later.

## Global requirements
- Pastel **vectorheart** theme — element kit in `assets/vectorheart/`, fonts in `assets/fonts/`.
- Heavy animation, but smooth (60fps target) and **mobile-friendly**; respect `prefers-reduced-motion`.

## Parked ideas (not building)
- Easter eggs (Konami code, typing "osu" on the Lobby).

## Dropped
- Résumé download. Fastwork link. Now playing (copyright risk). Achievements.

## Open questions
- BGM and SFX tracks: owner is choosing songs with clear, low-risk licences that fit the theme.
- NuageRose font (Gumroad, free) — owner to download and add to `assets/fonts/nuagerose/` with its license.
