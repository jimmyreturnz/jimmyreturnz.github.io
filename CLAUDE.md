# CLAUDE.md — jimmyreturnz portfolio

Personal portfolio for jimmyreturnz: developer + rhythm-game player (osu!taiko, osu!mania 4K, TETR.IO), in a pastel **vectorheart** style with heavy but smooth animation. Mobile must feel as good as desktop.

Read these before working:
- `GLOSSARY.md` — the project's vocabulary (Intro, Lobby, Warp, Portfolio, Showcase, BGM, Feature audio, SFX, …). Use these words exactly, in code and in conversation.
- `docs/FEATURES.md` — what the site contains, Showcase order, parked and dropped ideas, open questions.
- `docs/adr/` — decisions and why. Don't reverse one without discussing it.

## Stack (decided)
- **Hosting:** Cloudflare Pages, built from this repo; free `*.pages.dev` address first, `jimmyreturnz.dev` later (ADR 0001). Repo name stays `jimmyreturnz.github.io`; GitHub Pages will only serve a redirect.
- **Site:** Astro + TypeScript. React islands only where state is complex (Guestbook form, Guestbook admin). Chart players and animation are plain TypeScript.
- **Animation:** GSAP (Intro, Warp, UI motion); PixiJS for the taiko/mania players, lazy-loaded near their Showcase; CSS for idle loops. Target 60fps on a mid-range Android. Respect `prefers-reduced-motion`; offer a Lite mode toggle.
- **API:** Hono on Cloudflare Workers (ADR 0003). Data in Cloudflare D1.
- **Content:** Sveltia CMS at `/admin` edits Blog, Projects, Shoutouts, Timeline, Skills and Setups (Markdown/data files in the repo).
- **Tooling:** Bun (package manager + scripts), Biome (format + lint), GitHub Actions (checks on push; daily Stats Card refresh). Cloudflare deploys `main`, preview per branch.
- **Analytics:** Cloudflare Web Analytics only (no cookies, no banner).

## Planned layout
```
site/             Astro app
api/              Hono Worker (Guestbook, profile lookups)
packages/shared/  Types shared by site and api
assets/           vectorheart SVG kit, self-hosted fonts (move under site/public when site/ exists)
docs/             FEATURES.md, adr/
```

## Security rules
- No secrets in client code. API keys (osu! API, GitHub) live in GitHub Actions secrets or Worker secrets only.
- Guestbook: approve-before-publish, Turnstile, per-visitor rate limits, 300-char limit, no links, plain text escaped on output. Profile URLs are built server-side from verified IDs — never from visitor input.
- Work email shown via Cloudflare Email Obfuscation + copy button; no contact form.
- Security headers via Cloudflare (`_headers`): CSP, HSTS, frame-ancestors, etc.

## Audio rules
- BGM plays quietly in the Portfolio; it crossfades out whenever Feature audio plays and back in after.
- Chart players are **muted by default** and fetch audio only on demand. Every player shows a music credit (ADR 0002).
- Use only tracks with clear permission. BGM and SFX are still being chosen by the owner.

## Design assets
- `assets/vectorheart/vectorheart.svg` — sprite of original elements; colour with CSS `color`, `--vh-ink`, `--vh-shine`. `preview.html` shows them.
- `assets/fonts/fonts.css` — self-hosted OFL fonts (Zen Dots, Orbitron, Audiowide, Krona One, Monoton, Exo 2, Comfortaa, M PLUS Rounded 1c). Thai Guestbook font: Mali (to add).
- Inspiration: kenzync.dev (tool-card layout), hirokaze.net (theme applied to every bit of UI). Do not copy their assets.

## Skills in `.claude/skills/`
ui-ux-pro-max, storyboard, web-performance, gsap-*, 60fps-animation, pixijs-2d, sveltia-cms, grill-with-docs (+ grilling, domain-modeling), graphify. Provenance in `SOURCES.md`. Once there is real code, run `/graphify .` and keep `graphify-out/GRAPH_REPORT.md` current.
