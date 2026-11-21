# CLAUDE.md — jimmyreturnz portfolio

Personal portfolio for jimmyreturnz (Apiwat Kongsawat): **Data Scientist & Developer** first, rhythm-game player second (osu!taiko, osu!mania 4K/7K, TETR.IO), in a pastel **vectorheart** style with heavy but smooth animation. Mobile must feel as good as desktop.

## Hand-off note for the local session (from the cloud session, 2026-11-16)
Hi! The cloud session got this far; pick up from here on the owner's PC.

**Done (all on `main`):**
- Planning: grill session → `GLOSSARY.md`, `docs/FEATURES.md`, `docs/adr/0001–0003`; design council review (`docs/reviews/2026-11-16-design-council.md`); thegeekdesigner.com teardown (`docs/reviews/2026-11-16-thegeekdesigner-teardown.md`).
- Art: vectorheart SVG kit (`assets/vectorheart/`), self-hosted fonts (`assets/fonts/`), mockups + storyboard (`design-mocks/`).
- Site v1 in `site/` (Astro): cosy Lobby with Player Card; Portfolio pages Projects / Rhythm / TETR.IO / About / Community with client-side page transitions; light/dark theme (placeholder switch); uiverse sound button; brand icons; SoundCloud slot (click-to-load).
- Live stats at build time (`site/scripts/fetch-stats.ts`): TETR.IO API + osu! public profile pages (no keys) incl. mania 4K and 7K ranks and avatars.
- Rhythm: osu!taiko card; osu!mania card with 4K/7K switch (4K Quaoar [4K] To the star, own map; 7K // Under Construction // [7K] incompleteness by LostCool, used with permission); seek slider + play/pause that switch on when the song file exists (`site/src/scripts/chart-preview.ts`).

**Continue with (in rough order):**
1. Owner drops files: songs into `assets/audio/` and `.osu` files into `assets/charts/` (names in `site/README.md`); the BGM track; TETR.IO gameplay video. Then run `cd site && bun install && bun run dev`, and test seeking with `bun run build && bun run preview`.
2. Chart note renderer: parse the `.osu` files, draw notes on canvas/PixiJS synced to the audio clock and to the seek slider (`jr:chart-time` events); mania fall time = 11485 ms ÷ scroll speed (29 for 4K, 32 for 7K). Then Play mode, judgements, calibration (see `docs/FEATURES.md`).
3. BGM player in the header + crossfade on `jr:feature-audio` events.
4. Animation pass (`docs/FEATURES.md` → "Animation pass: ideas queued"): Intro (≤4 s, Skip from frame one) → Lobby, Warp (<0.8 s), full-screen menu with marquee rows, orbiting icons around the Lobby avatar, parallax, favicon.
5. Swap in the owner's theme switch (uiverse RiccardoRapelli/jolly-chicken-91, recoloured pink). uiverse.io blocks bots and it isn't in the github.com/uiverse-io/galaxy mirror, so ask the owner to paste the code.
6. Owner to-dos: SoundCloud link (`site/src/data/site.ts` → `links.soundcloud`), LinkedIn/Facebook links, project outcome numbers, setups/timeline details, NuageRose font, Cloudflare Pages setup + deploy hook secret, optional heads-up email to Camellia (see ADR 0002).
7. Later: Message Board API (Hono + D1), Sveltia CMS at `/admin`, security headers (`_headers`, allow `w.soundcloud.com`), chart carousel of the owner's maps.

**Owner asked you to read these for ideas:**
- https://reactbits.dev/ : animated React components (text, backgrounds, cursors). Our pages are plain Astro/TS; use React islands only where they earn it, or recreate the effect in GSAP.
- https://uiverse.io/elements?search=sound : more sound/audio UI elements (the current Sound button came from there: vinodjangid07/average-jellyfish-29). If uiverse.io blocks fetching, search the github.com/uiverse-io/galaxy mirror.

## Git
- Commit and push straight to `main` (owner's standing instruction). No feature branches unless asked.
- Commits are authored as the owner: `jimmyreturnz <101033761+jimmyreturnz@users.noreply.github.com>`, with no AI co-author or session trailers.

Read these before working:
- `GLOSSARY.md` — the project's vocabulary (Intro, Lobby, Warp, Portfolio, Showcase, BGM, Feature audio, SFX, …). Use these words exactly, in code and in conversation.
- `docs/FEATURES.md` — what the site contains, Showcase order, parked and dropped ideas, open questions.
- `docs/adr/` — decisions and why. Don't reverse one without discussing it.

## Stack (decided)
- **Hosting:** Cloudflare Pages, built from this repo; free `*.pages.dev` address first, `jimmyreturnz.dev` later (ADR 0001). Repo name stays `jimmyreturnz.github.io`; GitHub Pages will only serve a redirect.
- **Site:** Astro + TypeScript. React islands only where state is complex (Message Board form, Message Board admin). Chart players and animation are plain TypeScript.
- **Animation:** GSAP (Intro, Warp, UI motion); PixiJS for the taiko/mania players, lazy-loaded near their Showcase; CSS for idle loops. Target 60fps on a mid-range Android. Respect `prefers-reduced-motion`. No Lite toggle (owner's call); drop idle loops automatically on low frame rate.
- **API:** Hono on Cloudflare Workers (ADR 0003). Data in Cloudflare D1.
- **Content:** Sveltia CMS at `/admin` edits Blog, Projects, Shoutouts, Timeline, Skills, Setups (Markdown/data files in the repo).
- **Tooling:** Bun (package manager + scripts), Biome (format + lint), GitHub Actions (checks on push; daily Stats Card refresh). Cloudflare deploys `main`, preview per branch.
- **Current state:** Lobby at `/`; Portfolio pages `/projects/`, `/rhythm/`, `/tetrio/`, `/about/`, `/community/` (Astro ClientRouter: client-side page transitions, header persists; scripts must init on `astro:page-load`). No Intro/Warp/player animation yet; the owner asked for pages first. Light theme is default; dark uses `#1f1e33`. Ink is navy `#1f1e33` for now (plum `#3b2a4d` is the alternative, one token in `site/src/styles/global.css`).
- **Analytics:** Cloudflare Web Analytics only (no cookies, no banner).

Not built yet: `api/` (Hono Worker) and `packages/shared/`. `assets/` is the Astro publicDir (served at the site root).

## Security rules
- No secrets in client code. API keys (osu! API, GitHub) live in GitHub Actions secrets or Worker secrets only.
- Message Board: approve-before-publish, Turnstile, per-visitor rate limits, 300-char limit, no links, plain text escaped on output. Typed names are shown as plain text; there is no verification. The only profile links are ones the owner attaches by hand while approving. Rate limits use an HMAC of the IP with a daily-rotated secret, never the raw IP, disclosed on the page.
- Work email `apiwatkon.rtz@gmail.com` shown as a text link (Cloudflare Email Obfuscation) plus a labelled copy button; no contact form. It is also the takedown contact.
- Security headers via Cloudflare (`_headers`): CSP, HSTS, frame-ancestors, etc. CSP must allow `frame-src https://w.soundcloud.com` for the SoundCloud embed.

## Audio rules
- BGM plays quietly in the Portfolio; it crossfades out whenever Feature audio plays and back in after.
- Chart players are **muted by default** and fetch audio only on demand. Every player shows a music credit (ADR 0002).
- Use only tracks with clear permission. BGM and SFX are still being chosen by the owner.

## Design assets
- `assets/vectorheart/vectorheart.svg` — sprite of original elements; colour with CSS `color`, `--vh-ink`, `--vh-shine`. `preview.html` shows them.
- `assets/fonts/fonts.css` — provisional Latin set: Zen Dots (display), Comfortaa 400/700 (body), Orbitron 700 (numbers/HUD), Monoton (combo numerals only). `assets/fonts/fonts-jp.css` — M PLUS Rounded 1c, load only where Japanese appears. Audiowide, Krona One, Exo 2 and other Orbitron weights stay on disk but aren't loaded until the final font decision. Thai Message Board font: Mali (to add).
- Colour rule: pastels are never text. Ink `#3b2a4d` for text, `#c23a7a` for links/buttons, `#6b5b7d` for muted text. Any dark blue/navy is always `#1f1e33` (owner's favourite), including the night-theme base.
- `docs/reviews/2026-11-16-design-council.md` — design review whose accepted actions are folded into FEATURES.md.
- Inspiration: kenzync.dev (tool-card layout). Apply the theme to every bit of UI. Do not copy other sites' assets.

## Skills in `.claude/skills/`
ui-ux-pro-max, storyboard, web-performance, gsap-*, 60fps-animation, pixijs-2d, sveltia-cms, grill-with-docs (+ grilling, domain-modeling), graphify, unslop, emil-design-eng (+ choreograph), web-design-guidelines, thinkui-anti-slop. Run `web-design-guidelines` on changed UI files and the thinkui-anti-slop gate before calling a UI task done. Run `/unslop` on any prose visitors will read (bio, project write-ups, blog drafts) before committing it. Provenance in `SOURCES.md`. Once there is real code, run `/graphify .` and keep `graphify-out/GRAPH_REPORT.md` current.
