# Design council review — 2026-11-16

What was reviewed: the planned design in `CLAUDE.md`, `GLOSSARY.md`, `docs/FEATURES.md`, `docs/adr/0001–0003`, `design-mocks/portfolio-storyboard.html` and the art kit in `assets/`. Nothing is built yet. Five members each answered the same question from one lens: Recruiter (Sonnet), osu!/TETR.IO player (Sonnet), visual/brand designer (Sonnet), performance/mobile engineer (Haiku) and accessibility/safety skeptic (Haiku). The main session's earlier critique counts as a sixth opinion. The head reviewer (Opus) checked claims against the repo and wrote this synthesis. No other file has been changed.

## Members at a glance

| Member | Lens | Top problem | Most surprising point |
|---|---|---|---|
| 1 | Recruiter | The data-science half of the owner is missing | Skills and Setups mixes hiring evidence with gaming gear |
| 2 | Player | No judgement or calibration spec for the chart players | Quaoar is too dense for casual touch play; the autoplay preview should be the default |
| 3 | Visual | Pastels used as text fail contrast on cream | No motif budget: about 20 looping motifs is noise, not a system |
| 4 | Performance | SVG repaint cost in the Intro and Warp | Decoding a full song uses about 60 MB of RAM; plus the Cloudflare media terms question |
| 5 | Safety | Full songs rest on thin permission | Unverified Guestbook names would look verified |

## Consensus (raised by 3+ voices incl. the sixth opinion)

- **Data science is invisible.** Members 1, 3 and the sixth opinion. Neither the Lobby nor Projects has a slot for it.
- **Too many steps before proof.** Members 1, 5 and the sixth opinion (Member 4 on cost). Intro → Lobby → Enter → Warp before Projects; Skip only appears after 1s.
- **Pastel contrast.** Members 3, 5 and the sixth opinion. Pastels are fine as fills, never as text.
- **Too many fonts.** Member 3, the sixth opinion, and Member 4 (by weight).
- **Too much idle motion.** Members 3, 4 and the sixth opinion, with Member 2 on 60fps on a phone stacked on one page.
- **Chart player feel.** Member 2, Member 4 (audio clock) and the sixth opinion: the autoplay preview as the main experience, a practice option, and a real offset and timing spec.
- **ADR 0002 permission.** Members 1, 2 and 5 (Member 4 on codecs). Circles of Death relies on the owner's inference.
- **Works already:** the muted-by-default, on-demand, credited chart players (Members 2, 4, 5); the reduced-motion kill switch (Members 4, 5); the ink-on-pastel pairs and the original recolourable kit (Members 3, 5).

## Disagreements and rulings

- **Résumé PDF in the Lobby (Member 1) vs owner "no, never".** Rejected. The owner has decided. Put a visible contact row in the Lobby to carry the credibility job instead.
- **Guestbook hover cards (`FEATURES.md`) vs unverified names (Member 5).** Ruling: drop automatic hover cards, avatars and ranks for typed names. Show the name as plain text. When approving, the owner may attach a profile link by hand for people they know. Reason: a typed name with someone's real rank and avatar invites impersonation, and the no-verification decision stays intact.
- **PixiJS (stack) vs Canvas2D (Member 4).** Keep PixiJS as decided, with conditions: one shared renderer for both players, created on first open and destroyed when it closes. Reason: no WebGL context while scrolling, and the bundle cost lands only on opt-in. Revisit only if a mid-range Android measurement misses 60fps.
- **Intro and Warp length.** Ruling: Skip is focusable from t=0, the Intro is 4s at most and ends *as* the Lobby, the Warp is under 0.8s, and deep links (`/#projects`) bypass both. Member 1's 2s cap is too tight for an Intro the owner wants to be game-like. The 0.8s Warp keeps it from being a gate.
- **Full songs vs 30s clip (Members 1, 2, 5).** Keep full songs for Quaoar, which has a public, artist-published download. For Circles of Death, the risk is real but moderate: a non-commercial fan map with credit and a quick removal promise. Do not block launch on it, but write a takedown contact into the ADR and the footer, and ask Camellia's channels for written confirmation. Ship a pre-cut clip so a takedown takes minutes.
- **Decode vs stream audio (Member 4).** Stream the song through `<audio>`. Decode only the hitsounds. Schedule against `AudioContext.currentTime` and `outputLatency`. Reason: 60 MB of PCM per song is a real crash risk on iOS, and offset calibration absorbs the extra latency.
- **Sticky top nav (Member 1).** Deferred. A Lobby contact row plus a "Projects" jump chip may be enough. Decide after the hi-fi Lobby is drawn.

## Corrections

- **Member 3's link accent `#d6407f` fails:** 4.1:1 on cream, 4.29:1 on white, under the 4.5:1 needed for body text. Member 5's `#c23a7a` passes at 4.8:1 on cream. Use that.
- **Member 3's "pastels ~1.2–1.6:1"** is roughly right but understated: butter on cream is 1.09:1 and lavender 1.73:1.
- **Member 4's font numbers:** 264 `@font-face` rules and 252 M PLUS chunks are correct, and so is the 213 KB `fonts.css`. But the woff2 files total 3.5 MB (3.4 MB M PLUS), not 4.3 MB. Every M PLUS rule has a `unicode-range`, so browsers fetch only the chunks they need. The real cost is the 213 KB CSS on every page. The weight claim holds: Orbitron 500/900 and Exo 2 600 have no planned use.
- **Member 4's "live calls on first load" is overstated.** Stats Cards are built daily (`FEATURES.md`, `CLAUDE.md`), and the storyboard's "last known numbers + as of" fallback fits a build. The live requests are Guestbook profile lookups, which the hover-card ruling removes. Doc fix: `GLOSSARY.md` still defines a Stats Card as "live".
- **Member 4's `performance.now()` drift:** nothing in the plan says `performance.now()`. It is a fair warning, not a found defect.
- **Member 2's "no offset" and "taiko has no keys spec" are overstated.** The storyboard already shows offset, scroll speed, D F J K keys and don/ka touch zones. What is still missing is judgement windows, a calibration tap, drumroll behaviour and the hitsound set.
- **Member 5's "set ADR 0002 to Proposed":** no ADR has a status field. Add one to all three rather than single out 0002.
- **Member 1's GitHub bio claim** ("Data Scientist & Developer") is confirmed: the owner's GitHub profile says exactly that.
- **Member 4's Cloudflare bandwidth claim** is unverified — check before launch.

## Lone insights worth keeping

- Member 2: block page scroll inside the lane tap zones only while playing. Add a "Play on osu!" link to each beatmapset; Quaoar's map link is missing from `FEATURES.md`.
- Member 3: give each Showcase a signature colour (mania pink, taiko mint, TETR.IO sky, Blog lavender). Use −35° diagonals only in the Warp and Intro.
- Member 4: give the TETR.IO video `preload="none"`, a poster, and play only in view. Pause Pixi tickers offscreen. Cap DPR.
- Member 5: store the Guestbook IP hash as HMAC with a daily-rotated secret and disclose it on the page (Thai PDPA). Limit the Warp to 3 flashes per second or fewer. Give toggles text labels and `aria-pressed`.
- Sixth opinion: tie the kit to rhythm games (judgement text as feedback, a combo counter, a drum hit on Enter). Hide the Blog until it has posts. Design the night palette now.

## Top 10 actions

1. Add data science to the identity: a Lobby headline with the role, data/dev chips in Projects, and 2–3 pinned data projects, each with outcome, method and link · accept now · `FEATURES.md`, `GLOSSARY.md` (Projects), storyboard Lobby/Projects cards
2. Shorten the gates: Skip from t=0, Intro ≤4s ending as the Lobby, Warp <0.8s, deep links bypass, and in the Lobby a contact row (email, GitHub, LinkedIn) plus a "Projects" jump · accept now · `FEATURES.md` Flow, storyboard Intro/Lobby/Warp
3. Fix the Guestbook docs: plain-text typed names, no automatic hover card, optional owner-attached link at approval, HMAC IP hash disclosed; fix the `CLAUDE.md` "verified IDs" line · accept now · `CLAUDE.md`, `FEATURES.md`, storyboard Guestbook card
4. ADR 0002: add a takedown contact and a status field, ask for written confirmation for Circles of Death, keep a pre-cut clip ready, and set codec rules (AAC + Opus, a bitrate and size cap, stream not decode) · accept now · `docs/adr/0002-full-songs-with-credit.md`
5. Colour rule: pastels are never text; ink for labels; `#c23a7a` accent; `#6b5b7d` muted; one token file · accept now · storyboard `:root`, new tokens file when `site/` exists
6. Font cut: Zen Dots (display), Comfortaa (body), Orbitron 700 (HUD), Monoton (combo numerals only), M PLUS Rounded loaded only on the Guestbook; drop Audiowide, Krona One and unused weights; split `fonts.css` into Latin and CJK files · accept now · `assets/fonts/fonts.css`, `CLAUDE.md` Design assets
7. Chart player spec: autoplay preview as the default, Play opt-in, practice at 0.75×, calibration tap, judgement windows, a shared Pixi renderer · accept now · storyboard taiko/mania cards, new player spec doc later
8. Motion budget: 1–2 idle loops per content screen, 6–8 motifs in the Intro, pause offscreen and while a player is open, auto Lite on low FPS · accept now · `CLAUDE.md` Animation, storyboard
9. Split Skills and Setups into tech Skills (with evidence) and gaming Setups · decide later (changes the decided Showcase order) · `GLOSSARY.md`, `FEATURES.md`
10. Verify Cloudflare's media terms, and plan audio and video on R2 if needed · decide later · `docs/adr/0001-host-on-cloudflare-pages.md`

## ADR challenges

- **0001 Cloudflare Pages:** amend. "Unmetered bandwidth" is unverified for heavy audio and video. Check the self-serve terms and the per-file size limit, name R2 or Stream as the fallback, and add a status field.
- **0002 Full songs:** amend, do not reopen. Add a status field, a named takedown contact, the codec and size rules, and a pre-cut clip as the fallback. Circles of Death permission is inferred. Get it in writing when you can, but this is not grounds to drop full songs.
- **0003 Hono:** keep. No member challenged it.

## Questions for the owner

1. Should the Lobby headline say "Data Scientist"? (yes / no)
2. Split Skills and Setups into two Showcases? (yes / no)
3. Can you attach profile links to Guestbook names by hand at approval? (yes / no)
4. Intro cap of 4 seconds OK? (yes / other number)
5. Which takedown email goes in the footer? (address)
