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
- **osu!**: works with no setup by reading the public profile pages (`osu.ppy.sh/users/11306153/taiko` and `/mania`), including mania 4K and 7K ranks. Optional: an OAuth app (https://osu.ppy.sh/home/account/edit → OAuth → *New OAuth Application*) with `OSU_CLIENT_ID` / `OSU_CLIENT_SECRET` set locally and in Cloudflare Pages switches it to the official API.
- Daily refresh: `.github/workflows/daily-rebuild.yml` calls a Cloudflare Pages deploy hook (repo secret `CF_PAGES_DEPLOY_HOOK`).

## Audio and charts (coming)
Drop files here when ready; the players will pick them up:
- `assets/audio/bgm.m4a` + `bgm.opus`: BGM
- Chart songs (any of `.m4a`, `.opus`, `.mp3`; the player switches on by itself when one exists):
  - `assets/audio/quaoar.*` (4K)
  - `assets/audio/under-construction.*` (7K)
  - `assets/audio/circles-of-death.*` (taiko)
- Beatmap files: `assets/charts/quaoar-4k.osu`, `assets/charts/under-construction-7k.osu`, `assets/charts/circles-of-death-taiko.osu`
- Test seeking with `bun run build && bun run preview` (it supports range requests); a bare `python -m http.server` doesn't, so the slider jumps back to 0 there.
- `assets/audio/hitsounds/`: taiko don/kat hitsounds
