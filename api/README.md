# Message Board API

Hono on Cloudflare Workers, messages in Cloudflare D1. The Community page reads and posts here; messages go public as soon as they pass the checks. The owner can delete them or attach a profile link at `/community/admin/`.

## Local

```sh
cd api
bun install
cp .dev.vars.example .dev.vars   # test secrets; the Turnstile one always passes
bun run db:local                 # create the table in the local database (after a schema change: drop the table first)
bun run dev                      # http://localhost:8790 (8787 is taken by the Headroom proxy)
bun run test                     # input rules
```

The site picks up the local API from `site/.env.development` (restart `bun run dev` in `site/` after changing it). Open `http://localhost:4321/community/admin/` and type the `ADMIN_TOKEN` from `.dev.vars`.

## Production (one-time setup)

1. `bunx wrangler login`
2. `bunx wrangler d1 create board` and paste the `database_id` it prints into `wrangler.toml`.
3. `bun run db:remote`
4. In the Cloudflare dashboard, add a Turnstile widget for the site's address. Keep the site key for step 7.
5. Secrets (each command asks for the value):
   - `bunx wrangler secret put TURNSTILE_SECRET` (the widget's secret key)
   - `bunx wrangler secret put VISITOR_SECRET` (any long random string)
   - `bunx wrangler secret put ADMIN_TOKEN` (the inbox password: at least 32 characters, e.g. `openssl rand -hex 32`; shorter keeps the inbox locked)
6. Add the site's address (e.g. `https://jimmyreturnz.pages.dev`) to `ALLOWED_ORIGINS` in `wrangler.toml`, then `bun run deploy`.
7. Cloudflare dashboard → the Worker's zone → Security → WAF → Rate limiting rules: one rule on the API's address, e.g. 30 requests per 10 s per IP → Block. This stops floods at the edge before they count against the Worker's daily request quota.
8. In Cloudflare Pages → Settings → Environment variables, set `PUBLIC_API_URL` (the Worker's address) and `PUBLIC_TURNSTILE_SITEKEY`, and redeploy the site. Without them the Message Board stays hidden.

## Rules

- Name up to 40 characters, message up to 1000, no links. Names and messages are plain text everywhere.
- Spam filter: one message per visitor every 60 seconds (owner, 2026-11-23). A visitor is an HMAC of their IP under a key derived from `VISITOR_SECRET` and the date, so it changes daily and the IP itself is never stored.
- Senders can edit their own messages, once every 10 s per message, with the same checks. Posting returns a random edit key that only the sender's browser keeps (localStorage); the database stores its SHA-256. Edited messages show "(edited)".
- Messages are public straight away (owner, 2026-11-23). The owner can delete any message and attach an `https://` profile link in the inbox.
- Flood guard: 60 requests a minute per visitor across all routes (Workers rate-limit binding `RL` in `wrangler.toml`), and request bodies over 8 KB are refused before parsing. Spread-out floods from many IPs are for the WAF rule in step 7.
- Site security headers (CSP, HSTS, frame-ancestors, …) are in `assets/_headers`. If the API moves off `*.workers.dev`, add its address to `connect-src` there.
