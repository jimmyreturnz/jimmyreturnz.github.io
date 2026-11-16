# Portfolio: feature list

Living list of what the site should contain. Order = rough page order.
Design council review that shaped this version: `docs/reviews/2026-11-16-design-council.md`.

## Who it's for
Recruiters and the osu!/TETR.IO community, equally. Identity: **Data Scientist & Developer** first, rhythm-game player second (the player side is personality, not the whole identity). Working towards AI Engineer; don't claim that title yet.

## Flow
1. **Intro**: game-like, first visit only (remembered in localStorage). **Skip** is a focusable button from the very first frame (Esc also skips). At most **4 s** (adjustable later). It ends *as* the Lobby, not before it.
2. **Lobby**: role headline ("Data Scientist & Developer"), avatar, short info, player card, a **contact row** (email, GitHub, LinkedIn) and a "Projects" jump link, then the **Enter** button.
3. **Warp**: under **0.8 s**, max 3 flashes per second. *(animation + sound TBD)*
- Links straight to a section (e.g. `/#projects`, used on CV and LinkedIn) skip the Intro, Lobby and Warp.

## Inside the portfolio
Showcase order: Projects → Skills → osu!taiko → osu!mania → TETR.IO → Setups → Timeline → Blog → Shoutouts → Guestbook → footer (LinkedIn, GitHub, Instagram, Facebook, work email).

- **BGM** at low volume, visibly pausable from the Portfolio header; mute is remembered. Crossfades out when Feature audio plays, back in when it stops.
- **Projects**: GitHub repos, internship and career work, including **BMW** projects (data science). Filter chips: *data* / *dev*. 2–3 pinned data projects. Each card: one-line outcome (with a number where possible), method/stack, role, link. Private work gets a sanitised write-up instead of a link.
- **Skills**: tech skills only, grouped, each backed by evidence (a project or link).
- **osu!taiko**: Camellia – Circles of Death, own map (https://osu.ppy.sh/beatmapsets/2404655#taiko/5216517).
- **osu!mania 4K**: かめりあ – Quaoar, own map, 4K. Layout reference: kenzync.dev tool cards.
- **Chart players (both)**: **autoplay preview is the default** (the chart plays itself, synced, with hitsounds); **Play** is opt-in, with a practice option (0.75× speed, a 20–30 s section), a calibration tap for audio offset (saved per device), judgement windows (300/100/miss) with early/late feedback. Muted by default. Lane/drum tap zones block page scroll only while playing. Credit line + "Play on osu!" link to the beatmapset.
- **TETR.IO**: looping gameplay video (already recorded): poster image, `preload="none"`, plays muted and only while on screen.
- **Setups**: gaming gear and settings (keys, tablet/keyboard, TETR.IO handling).
- **Timeline**: high school, university, internship, career only; secondary, not a main focus.
- **Stats Cards**: osu!, TETR.IO, GitHub; refreshed **daily** by a build job. GitHub leads in the Lobby player card; each card links to the matching profile.
- **Shoutouts**: friends and people I respect, optional avatar, link and short quote each. Editable as content.
- **Guestbook**: TH / EN / JP with cute fonts. No accounts, no username verification: visitors type any name, shown as **plain text** (no automatic hover card, avatar or rank). The owner approves every message by hand and may attach a profile link by hand while approving. Per-visitor limits by an HMAC of the IP with a daily-rotated secret (never the raw IP), disclosed on the page: 1 pending, 1 post per day. Paginated: 20 per page, newest first.
- **Blog**: write, edit, add images like a blogger (Sveltia CMS). Hidden until it has a few posts.
- **Night theme**: switch design coming from owner; night palette designed alongside the day palette.
- **Footer**: social links, work email `apiwatkon.rtz@gmail.com` (also the takedown contact for music), music credits, "Watch Intro again".

## Global requirements
- Pastel **vectorheart** theme: kit in `assets/vectorheart/`, fonts in `assets/fonts/`.
- **Colour rule**: pastels are fills and decoration only, never text. Text and labels use ink `#3b2a4d`; links/buttons accent `#c23a7a`; muted text `#6b5b7d`. **Dark blue is always `#1f1e33`** (owner's favourite): use it wherever a dark blue/navy is needed, including as the base of the night theme. All colours live in one token file once `site/` exists.
- **Fonts (provisional)**: Zen Dots (display), Comfortaa (body), Orbitron 700 (numbers/HUD), Monoton (combo numerals only). M PLUS Rounded 1c (Japanese) loads only where Japanese appears. Final choice still open.
- **Motion budget**: 1–2 idle loops per content screen, 6–8 moving motifs in the Intro; −35° diagonals only in the Intro and Warp, content stays horizontal. Pause everything off screen and while a chart player is open. Auto Lite mode on low frame rate, plus the Lite toggle.
- Smooth (60fps target) and **mobile-friendly**; respect `prefers-reduced-motion` (still title card instead of Intro, fade instead of Warp).
- Accessibility: keyboard for everything, visible focus, toggles with text labels and `aria-pressed`, colour never the only signal.
- Theme the dull parts too: loaders, scrollbars, focus rings, form errors, 404 ("Miss!").

## Parked ideas (not building)
- Easter eggs (Konami code, typing "osu" on the Lobby).

## Dropped
- Résumé download (owner: never). Fastwork link. Now playing (copyright risk). Achievements.

## Open questions
- BGM and SFX tracks: owner is choosing songs with clear, low-risk licences.
- Final font choice (provisional set above).
- NuageRose font (Gumroad, free): owner to download and add to `assets/fonts/nuagerose/` with its licence.
- Cloudflare's terms for serving lots of audio/video (see ADR 0001).
