# To do

- [ ] **Security review** of the whole site and the Message Board API (`api/`) before going live: security headers (`_headers`: CSP incl. `frame-src https://w.soundcloud.com` and Turnstile's `challenges.cloudflare.com`, HSTS, frame-ancestors), the API's input checks, cooldown and edit keys, the admin inbox at `/community/admin/`.
- [ ] **Deploy**: Cloudflare Pages for the site, and the Message Board Worker + D1 + Turnstile + secrets (steps in `api/README.md`). Then set `SITE_URL`, `PUBLIC_API_URL` and `PUBLIC_TURNSTILE_SITEKEY` in Pages and add the site's address to `ALLOWED_ORIGINS`.
- [x] **TETR.IO recording** (2026-11-23): four rounds captured from the replay viewer (masters in `D:\Jimmy\GameRelated\TetrisReplays\clips\`); the TETR.IO page plays them one after another (`site/scripts/encode-video.sh` makes `assets/video/tetrio-N.mp4`). Opponents are fine with their names showing (owner asked, 2026-11-23).
