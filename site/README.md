# Site (Astro)

```bash
cd site
bun install
bun run dev            # http://localhost:4321
bun run build          # fetches Stats Card data, then builds to dist/
bun run build:offline  # builds with the last saved stats (no network)
```

## Where things live
- `src/data/site.ts`: all page text and lists (profile, projects, skills, setups, timeline, shoutouts). `null` shows a striped placeholder.
- `src/data/stats.json`: osu! and TETR.IO numbers, written by `scripts/fetch-stats.ts`. Committed as the fallback when an API is down.
- `../assets/`: served at the site root (`publicDir`). Fonts, the vectorheart kit, Stats Card avatars (`assets/stats/`), and later audio and charts.
- `src/pages/index.astro`: Lobby. `src/pages/portfolio/index.astro`: Portfolio.

## Stats Cards
- **TETR.IO**: public API, works with no setup.
- **osu!**: needs an OAuth app. On https://osu.ppy.sh/home/account/edit → OAuth → *New OAuth Application* (any name, callback URL can be blank), then set `OSU_CLIENT_ID` and `OSU_CLIENT_SECRET` as environment variables (locally, and in Cloudflare Pages → Settings → Environment variables). Without them the osu! numbers stay as placeholders; the avatar still updates.
- Daily refresh: `.github/workflows/daily-rebuild.yml` calls a Cloudflare Pages deploy hook (repo secret `CF_PAGES_DEPLOY_HOOK`).

## Audio and charts (coming)
Drop files here when ready; the players will pick them up:
- `assets/audio/bgm.m4a` + `bgm.opus`: BGM
- `assets/audio/quaoar.m4a` / `.opus`, `assets/audio/circles-of-death.m4a` / `.opus`: chart songs
- `assets/charts/quaoar-4k.osu`, `assets/charts/circles-of-death-taiko.osu`: the beatmap files
- `assets/audio/hitsounds/`: taiko don/kat hitsounds
