# Message Board API

Hono on Cloudflare Workers, messages in Cloudflare D1. The Community page reads and posts here; messages go public as soon as they pass the checks. The owner can delete them or attach a profile link at `/community/admin/`.

## Local

```sh
cd api
bun install
cp .dev.vars.example .dev.vars   # test secrets; the Turnstile one always passes
bun run db:local                 # create the table in the local database
bun run dev                      # http://localhost:8787
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
   - `bunx wrangler secret put ADMIN_TOKEN` (any long random string; this is the inbox password)
6. Add the site's address (e.g. `https://jimmyreturnz.pages.dev`) to `ALLOWED_ORIGINS` in `wrangler.toml`, then `bun run deploy`.
7. In Cloudflare Pages → Settings → Environment variables, set `PUBLIC_API_URL` (the Worker's address) and `PUBLIC_TURNSTILE_SITEKEY`, and redeploy the site. Without them the Message Board stays hidden.

## Rules

- Name up to 40 characters, message up to 1000, no links. Names and messages are plain text everywhere.
- One message per visitor per day. A visitor is an HMAC of their IP under a key derived from `VISITOR_SECRET` and the date, so it changes daily and the IP itself is never stored.
- Messages are public straight away (owner, 2026-11-23). The owner can delete any message and attach an `https://` profile link in the inbox.
