---
status: accepted
---

# Hono, not ElysiaJS, for the Worker API

The small API (Guestbook, profile lookups) runs on Cloudflare Workers, so it uses Hono, which is built for Workers. ElysiaJS was the owner's first choice, but it targets Bun on a long-running server, and its Cloudflare Workers adapter was still described as experimental and not production-ready as of late 2026. Hono offers the same chained, type-safe style, so switching later costs little if Elysia's Workers support matures.
