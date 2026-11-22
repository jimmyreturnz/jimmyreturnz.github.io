# Portfolio: feature list

Living list of what the site should contain. Order = rough page order.
Design council review that shaped this version: `docs/reviews/2026-11-16-design-council.md`.

## Who it's for
Recruiters and the osu!/TETR.IO community, equally. Identity: **Data Scientist & Developer** first, rhythm-game player second (the player side is personality, not the whole identity). Working towards AI Engineer; don't claim that title yet.

## Panel review 2026-11-22 (applied)
- Nothing unfinished is shown: no `[placeholder]`, "coming soon" or disabled buttons. Community is in the nav (owner, 2026-11-23); its Message Board shows only when the site is built with the API address; the TETR.IO gameplay video slot comes back when the clip exists; chart Play buttons come back with Play mode.
- SEO and AI search: Open Graph, JSON-LD `Person`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`. Set `SITE_URL` at build time for canonical links and the sitemap. `assets/og.png` is a stand-in until the brand pass.

## Flow
1. **Intro**: game-like, first visit only (remembered in localStorage). **Skip** is a focusable button from the very first frame (Esc also skips). At most **4 s** (adjustable later). It ends *as* the Lobby, not before it.
2. **Lobby**: role headline ("Data Scientist & Developer"), avatar, short info, player card, status chips (open to, location, study), a **contact row** (email, GitHub, LinkedIn). **Enter** is the one main button, beside "Say hi", on the first screen (panel review 2026-11-22: one door, no separate "Projects" link).
3. **Warp**: under **0.8 s**, max 3 flashes per second. *(animation + sound TBD)*
- Links straight to a section (e.g. `/#projects`, used on CV and LinkedIn) skip the Intro, Lobby and Warp.

## Inside the portfolio
Pages (each its own URL, animated page transitions, header + BGM persist): **About** (Skills, Setups, Timeline) → **Projects** → **osu!** (osu!taiko, osu!mania 4K/7K, chart carousel later, SoundCloud) → **TETR.IO** → **Community** (Shoutouts, Message Board). Footer on every page (LinkedIn, GitHub, Instagram, Discord, Facebook, work email). Full-screen menu overlay comes with the animation pass (see `docs/reviews/2026-11-16-thegeekdesigner-teardown.md`).

- **BGM** at low volume, visibly pausable from the Portfolio header; mute is remembered. Crossfades out when Feature audio plays, back in when it stops.
- **Projects**: GitHub repos, internship and career work, including **BMW** projects (data science). Filter chips: *data* / *dev*. 2–3 pinned data projects. Each card: one-line outcome (with a number where possible), method/stack, role, link. Private work gets a sanitised write-up instead of a link.
- **Skills**: tech skills only, grouped, each backed by evidence (a project or link).
- **osu!taiko**: Camellia – Circles of Death, own map (https://osu.ppy.sh/beatmapsets/2404655#taiko/5216517).
- **osu!mania**: one card with a **4K / 7K switch** that swaps chart, credits, ranking and lanes. 4K: かめりあ – Quaoar [4K] To the star (own map). 7K: Camellia – // Under Construction // [7K] incompleteness by **LostCool, used with permission**. Layout reference: kenzync.dev tool cards.
- **Seek slider** on every chart preview: drag or use arrows (±5 s), Page Up/Down (±15 s), Home/End; play/pause button and time readout. Turns on automatically once the song file exists; the note renderer will follow it in the animation pass.
- **Chart players (both)**: **autoplay preview is the default** (the chart plays itself, synced, with hitsounds); **Play** is opt-in, with a practice option (0.75× speed, a 20–30 s section), a calibration tap for audio offset (saved per device), judgement windows (300/100/miss) with early/late feedback. Muted by default. Lane/drum tap zones block page scroll only while playing. osu!mania uses the owner's scroll speeds by default: 29 (4K), 32 (7K), with fall time = 11485 ms ÷ speed as in osu!lazer; visitors can change it. Credit line + "Play on osu!" link to the beatmapset.
- **TETR.IO**: looping gameplay video (already recorded): poster image, `preload="none"`, plays muted and only while on screen.
  - **TODO (owner records later): clips to capture from TETR.IO's replay viewer** (replays stay in `D:\Jimmy\GameRelated\TetrisReplays\`, never in the repo): `khet74.ttrm` round 10, `mickey2min150apm.ttrm` round 5, `vsasuu2Lpcend.ttrm` round 12, `funset.ttrm` round 9. Remind the owner when TETR.IO page work starts. Replay re-simulator (`D:\Jimmy\CodingProject\ttrm_player`) parked at 78/246 attacks matched.
- **Setups**: gaming gear and settings (keys, tablet/keyboard, TETR.IO handling).
- **Timeline**: high school, university, internship, career only; secondary, not a main focus.
- **Stats Cards**: osu!, TETR.IO, GitHub; refreshed **daily** by a build job. GitHub leads in the Lobby player card; each card links to the matching profile.
- **Shoutouts**: friends and people I respect, optional avatar, link and short quote each. Editable as content.
- **Message Board**: TH / EN / JP with cute fonts. No accounts, no username verification: visitors type any name, shown as **plain text** (no automatic hover card, avatar or rank). Messages go public as soon as they pass the checks; no approval step (owner, 2026-11-23). The owner can delete any message and attach a profile link by hand in the inbox. Messages up to 1000 characters, no links (owner, 2026-11-23). Per-visitor limit by an HMAC of the IP with a daily-rotated key (never the raw IP): 1 message per day. No note about it under the form (owner, 2026-11-23). 20 per page, newest first, in a box as tall as the form that scrolls and loads older pages as you reach the end. Owner's inbox: `/community/admin/` (built: `api/`, see `api/README.md`).
- **SoundCloud**: embedded playlist (owner's, link to come). Click-to-load so nothing from SoundCloud loads until a visitor asks; volume can duck under Feature audio via SoundCloud's Widget API. Security headers must allow `w.soundcloud.com`.
- **Blog**: write, edit, add images like a blogger (Sveltia CMS). Hidden until it has a few posts.
- **Night theme**: switch design coming from owner; night palette designed alongside the day palette.
- **Footer**: social links, work email `apiwatkon.rtz@gmail.com` (also the takedown contact for music), music credits, "Watch Intro again".

## Global requirements
- Pastel **vectorheart** theme: kit in `assets/vectorheart/`, fonts in `assets/fonts/`.
- **Colour rule**: pastels are fills and decoration only, never text. Text and labels use ink `#3b2a4d`; links/buttons accent `#c23a7a`; muted text `#6b5b7d`. **Dark blue is always `#1f1e33`** (owner's favourite): use it wherever a dark blue/navy is needed, including as the base of the night theme. All colours live in one token file once `site/` exists.
- **Fonts (provisional)**: Zen Dots (display), Comfortaa (body), Orbitron 700 (numbers/HUD), Monoton (combo numerals only). M PLUS Rounded 1c (Japanese) loads only where Japanese appears. Final choice still open.
- **Motion budget**: 1–2 idle loops per content screen, 6–8 moving motifs in the Intro; −35° diagonals only in the Intro and Warp, content stays horizontal. Pause everything off screen and while a chart player is open. No Lite toggle (owner's call); if the frame rate drops, idle loops switch off automatically.
- Smooth (60fps target) and **mobile-friendly**; respect `prefers-reduced-motion` (still title card instead of Intro, fade instead of Warp).
- Accessibility: keyboard for everything, visible focus, toggles with text labels and `aria-pressed`, colour never the only signal.
- Theme the dull parts too: loaders, scrollbars, focus rings, form errors, 404 ("Miss!").

## Animation direction (grilled 2026-11-16)
- **Motion language**: soft and floaty everywhere (owner picked this over a game-style layer). The one deliberate game moment is the Intro.
- **Build order**: rolling numbers → page transitions → menu overlay → orbiting icons and parallax → Warp → Intro → BGM beat pulses.
- **Intro**: a PC boot-up in the spirit of Needy Streamer Overload (owner's pick; look from KatsuDon Editor's NSO theme in `taiko_arranger/ui/windose.py` and `theme.py`: blue/pink diagonal-stripe wallpaper `#bbddff`/`#eeaaff`, pixel stickers, light pink `#ffc6e3` windows outlined `#ff66aa`, Press Start 2P titles), shown **before the Lobby** (Intro → Lobby). It opens on a power button; clicking it (the audio permission) plays a vectorheart transition, then boot with a glitch burst and sound, the boot text "x3NiGMaZ BIOS v1.0" (lines: CPU/MEM ok ♥, detecting osu!taiko / osu!mania / TETR.IO / Python, booting jimmyreturnz...), our heart logo with a loading bar for the rest, an automatic login for "jimmyreturnz", then the desktop windows pop open and hand off to the Lobby. Glitch = RGB split plus slice jitter in 2–3 short bursts, ≤3 flashes per second, plain fade under reduced motion. Audio is on by default once the power button is clicked, with an adjustable, remembered volume and a mute. Title bars use Press Start 2P (placeholder; owner will change it later, so keep it one font token). Skip from the first frame, once per browser (`localStorage`), replay link in the footer. Our own logo, chime and window art only: no Microsoft or Needy Girl Overdose assets. Fonts are placeholders; the owner may swap in his own display font.
- **Volume**: two levels, remembered in `localStorage`: effects/SFX 70%, music (BGM and songs) 40%, plus a mute. Audio starts at the power-button interaction.
- **Power-button sequence** (owner, being refined): hold the power button for a brief moment, it explodes into circle ripples; once the ripples have left the screen, vectorheart arrows appear and travel bottom-left to top-right; then a wave across the middle becomes an audio-visualizer histogram on the floor of the Lobby. All SVG. Up to about 5 s until every Lobby element has popped in (longer than the 0.8 s Warp; the Warp stays short).
- **Lobby idle loops**: slow gradient drift (cheap CSS) and pulsing circles; no moving arrows in the Lobby for now (the arrows live in the power-button sequence). Orbiting icons have transparent backgrounds.
- **Menu overlay**: circle reveal from the menu button, one marquee row per page, tinted by the hovered row. Accepted for now.
- **Intro timing and input** (owner, 2026-11-16): total 3–5 s (storyboard `design-mocks/intro-storyboard.html`, ~4.8 s). Mouse: hold the power button 0.7 s with a circular progress stripe, then it explodes into ripples; phone: one tap; keyboard: hold Space/Enter; screen readers get a plain button. Orbiting icons: glyph only, no background tile. Polish bundle accepted: heart loading bar, "Miss!" 404, pink scrollbars, pulsing focus ring, Message Board submit/arrive animations.
- **Warp**: reuses the Intro's ripples (avatar ring bursts into ripples, pink wash, a few vectorheart arrows), ~0.8 s; avatar shrinks into the header logo.
- **Header visualizer**: instead of bars next to the Sound button, the top bar plays the music as a faint colour visualizer behind the header; still when muted.
- **Rolling numbers**: built (`site/src/scripts/roll.ts`; Player Card tabs, 4K/7K switch, GitHub year switch). Tiles on the TETR.IO and osu! pages still to wire (`data-roll`).
- **Animation pass v1 built (2026-11-16)**, all in `site/src/scripts/` (motion, audio, fx, intro, warp, viz, roll) and components (Intro, Warp, Histogram, Orbit, PortfolioHeader menu, Settings volume). To see everything while your OS has "reduce motion" on, open the site with `?motion=full` (remembered; `?motion=system` undoes it) and replay the Intro with `/?intro=1`. Sounds are generated placeholders. Not built: custom cursor (parked again with the NSO-free Lobby), BGM beat pulses (no BGM yet).
- **Click feedback**: soft squish plus 3–4 tiny hearts on buttons and tabs (no "GREAT" text pops).
- **Page transitions**: Flip morph (nav item becomes the next page's title); fade-and-rise fallback for reduced motion and first load.
- **Warp**: the avatar ring expands into a pink wash with hearts streaming past, then settles; the avatar becomes the header logo. ≤0.8 s, ≤3 flashes per second.
- **Theme switch**: circular reveal from the switch (View Transitions), plain fade under reduced motion.
- **Rolling numbers**: odometer columns (Orbitron), ~0.8 s ease-out, on first view and on every change; try this first, fall back to a count-up if it looks off.
- **Idle loops and reveals**: Lobby only has floating hearts and breathing rings; other pages have none except a gentle header-decoration drift. Headings rise line by line, cards fade up with a small stagger, once only.
- **Custom cursor**: cute, reimagined pink heart-arrow (own art, NSO palette), desktop only, Intro and Lobby only (CSS cursor image). Portfolio pages use the normal cursor.
- **Lobby background**: the vectorheart theme, not the NSO stripes: animated colour gradient, moving arrows and pulsing circles (subject to the idle-loop budget, being grilled). NSO look is the Intro desktop only: **no NSO element in the Lobby** (owner, 2026-11-16), so no title-bar windows or stripes there; the Intro's stripes, windows and stickers fade away as the Lobby appears. The cursor, if built, is our own cute heart, not NSO.
- **Visualizers react hard**: fast attack, bass-weighted, boosted; they follow the real song (chart songs and, later, the BGM) and beat on a synthetic pulse otherwise.
- References studied: Joffrey Spitzer (Astro + GSAP Flip), Framer "Pixel Arcade" (boot screen, scroll HUD), Codrops pixel-mask transition. Pixel art rejected (Sage Agency: undermines a professional look); stay vector.

- **Intro trimmed (owner, 2026-11-21)**: power button → ripples (no spark dots rushing in while holding) → boot text, logo, login → Lobby. The NSO desktop (stripes, stickers, profile.exe / player_card.exe windows), the arrow flocks and the wave are removed. BGM starts when the Lobby appears (not during the Intro) and keeps playing across all pages.

## Animation pass: ideas queued (pages first, animation later)
- **Orbiting icons on the Lobby avatar** (owner's idea; reference: the About section of dousanmiao.com): hovering or focusing the profile picture makes osu!, TETR.IO, Python, Claude, SQL and ML icons orbit around it (owner confirmed, added ML). On touch, a tap toggles it. Icons from simple-icons (osu!, Python, Claude, a database glyph for SQL); TETR.IO uses our own tetromino mark; ML uses our own neural-network glyph. Static ring of icons under reduced motion.
- Full-screen menu overlay with one slow marquee row per Portfolio page; hovering a row tints the overlay in that page's colour (see the thegeekdesigner teardown).
- Lobby background layers (rings, hearts, blobs) shift gently with the pointer (parallax); off on touch and reduced motion.
- Favicon stays the profile picture (owner); no beating-heart favicon.
- Header slims down after scrolling past the page title.
- Suggested extras:
  - **Judgement pop on click**: buttons briefly pop a tiny "300" / "GREAT" like a hit judgement.
  - **D F J K key lights**: pressing D, F, J or K anywhere on the osu! page lights up the lanes in the header: 4K D F J K, taiko kddk also D F J K (D left kat, F left don, J right don, K right kat), 7K S D F Space J K L; optional key-press sound.
  - **Stats count up** when the Player Card or a stats tile first scrolls into view.
  - **Rolling numbers on every change** (owner): whenever an action swaps the numbers shown (Player Card tab, osu!mania 4K/7K switch, TETR.IO), each number scrolls/counts up from its old or zero value to the new one, odometer-style. Static numbers under reduced motion.
  - **Heart avatar beats to the BGM's BPM** once BGM exists.
  - **TETR.IO page**: stats tiles drop in like tetrominoes and "clear a line" when all are in.

## Parked ideas (not building)
- Easter eggs (Konami code, typing "osu" on the Lobby).

## Dropped
- Résumé download (owner: never). Fastwork link. Now playing (copyright risk). Achievements.

## Open questions
- BGM and SFX tracks: owner is choosing songs with clear, low-risk licences.
- Final font choice (provisional set above).
- NuageRose font (Gumroad, free): owner to download and add to `assets/fonts/nuagerose/` with its licence.
- Cloudflare's terms for serving lots of audio/video (see ADR 0001).
