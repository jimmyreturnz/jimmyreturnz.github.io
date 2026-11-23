// Message Board API (Hono on Cloudflare Workers, data in D1). See schema.sql and README.md.
//   GET  /messages?page=1            messages, newest first, 20 a page
//   POST /messages {name, message, token}   a new message, public straight away once it passes the checks (owner, 2026-11-23);
//                                           60 s cooldown per visitor; returns an edit key only the sender's browser keeps
//   PUT  /messages/:id {message, key}       edit your own message (no cooldown, same checks)
//   POST /admin/messages/:id/link {link?}   attach or clear a profile link   (Authorization: Bearer ADMIN_TOKEN)
//   DELETE /admin/messages/:id                                               (same)
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bearerAuth } from 'hono/bearer-auth';
import { bodyLimit } from 'hono/body-limit';
import { checkMessage, checkLink, PAGE_SIZE } from './rules';

type Env = { DB: D1Database; RL: RateLimit; ALLOWED_ORIGINS: string; TURNSTILE_SECRET: string; VISITOR_SECRET: string; ADMIN_TOKEN: string };
const app = new Hono<{ Bindings: Env }>();

app.use('*', (c, next) => cors({ origin: c.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()), allowMethods: ['GET', 'POST', 'PUT', 'DELETE'], allowHeaders: ['Content-Type', 'Authorization'], maxAge: 86400 })(c, next));

const enc = new TextEncoder();
const hmac = async (key: string, data: string) => {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(data)))].map((b) => b.toString(16).padStart(2, '0')).join('');
};
/** The visitor's fingerprint for today: HMAC of the IP under a key derived from the secret and today's date (UTC), so it can't be
 *  reversed or linked across days. The raw IP is never stored. */
const visitorId = async (secret: string, ip: string) => hmac(await hmac(secret, new Date().toISOString().slice(0, 10)), ip);

// flood guard for every route, keyed on the daily visitor fingerprint (never the raw IP); limits in wrangler.toml [[ratelimits]].
// ponytail: per-visitor only; a botnet spreading over many IPs needs the Cloudflare WAF rate-limiting rule (api/README.md)
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next();
  const { success } = await c.env.RL.limit({ key: await visitorId(c.env.VISITOR_SECRET, c.req.header('CF-Connecting-IP') ?? '0.0.0.0') });
  if (!success) return c.json({ error: 'Too many requests. Please slow down a little.' }, 429);
  await next();
});
// real requests are a few hundred bytes; refuse big bodies before parsing them
app.use('*', bodyLimit({ maxSize: 8 * 1024, onError: (c) => c.json({ error: 'That request is too large.' }, 413) }));

const sha256 = async (s: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');
const COOLDOWN_MS = 60_000, EDIT_COOLDOWN_MS = 10_000;

const turnstileOk = async (secret: string, token: unknown, ip: string) => {
  if (typeof token !== 'string' || !token) return false;
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret, response: token, remoteip: ip }) });
  return ((await r.json()) as { success?: boolean }).success === true;
};

app.get('/messages', async (c) => {
  const page = Math.max(1, Math.min(1000, Number(c.req.query('page')) || 1));
  const { results } = await c.env.DB.prepare('SELECT id, name, body, link, created_at, edited_at FROM messages WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind('approved', PAGE_SIZE + 1, (page - 1) * PAGE_SIZE).all();
  c.header('Cache-Control', 'public, max-age=5'); // new messages show up for everyone within a few seconds
  return c.json({ items: results.slice(0, PAGE_SIZE), more: results.length > PAGE_SIZE });
});

app.post('/messages', async (c) => {
  const input = await c.req.json<{ name?: unknown; message?: unknown; token?: unknown }>().catch(() => null);
  if (!input) return c.json({ error: 'Bad request.' }, 400);
  const msg = checkMessage(input);
  if (!msg.ok) return c.json({ error: msg.error }, 400);
  const ip = c.req.header('CF-Connecting-IP') ?? '0.0.0.0';
  if (!(await turnstileOk(c.env.TURNSTILE_SECRET, input.token, ip))) return c.json({ error: 'The spam check didn’t pass. Please try again.' }, 403);
  const visitor = await visitorId(c.env.VISITOR_SECRET, ip);
  // spam filter: one message per visitor every 60 s
  const at = Date.now();
  const last = await c.env.DB.prepare('SELECT MAX(created_at) AS t FROM messages WHERE visitor = ?').bind(visitor).first<{ t: number | null }>();
  const wait = last?.t ? Math.ceil((last.t + COOLDOWN_MS - at) / 1000) : 0;
  if (wait > 0) return c.json({ error: `Please wait ${wait} s before sending another message.`, retryAfter: wait }, 429);
  // the edit key goes back to the sender only; the database keeps its hash
  const key = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '');
  // the cooldown is checked again inside the insert itself, so two requests sent at once can't both get through
  const row = await c.env.DB.prepare('INSERT INTO messages (name, body, status, visitor, edit_hash, created_at) SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM messages WHERE visitor = ? AND created_at > ?) RETURNING id')
    .bind(msg.name, msg.body, 'approved', visitor, await sha256(key), at, visitor, at - COOLDOWN_MS).first<{ id: number }>();
  if (!row) return c.json({ error: 'Please wait a moment before sending another message.', retryAfter: COOLDOWN_MS / 1000 }, 429);
  return c.json({ id: row?.id, name: msg.name, body: msg.body, link: null, created_at: at, edited_at: null, key, cooldown: COOLDOWN_MS / 1000 }, 201);
});

app.put('/messages/:id', async (c) => {
  const input = await c.req.json<{ message?: unknown; key?: unknown }>().catch(() => null);
  if (!input || typeof input.key !== 'string' || input.key.length < 32) return c.json({ error: 'Bad request.' }, 400);
  const id = Number(c.req.param('id'));
  const row = await c.env.DB.prepare('SELECT name, edit_hash FROM messages WHERE id = ?').bind(id).first<{ name: string; edit_hash: string | null }>();
  if (!row || !row.edit_hash || row.edit_hash !== (await sha256(input.key))) return c.json({ error: 'You can only edit your own messages.' }, 403);
  const msg = checkMessage({ name: row.name, message: input.message });
  if (!msg.ok) return c.json({ error: msg.error }, 400);
  const at = Date.now();
  // one edit every 10 s per message, so a held edit key can't be used to churn the board
  const r = await c.env.DB.prepare('UPDATE messages SET body = ?, edited_at = ? WHERE id = ? AND (edited_at IS NULL OR edited_at < ?)').bind(msg.body, at, id, at - EDIT_COOLDOWN_MS).run();
  if (!r.meta.changes) return c.json({ error: 'Please wait a few seconds before editing again.', retryAfter: EDIT_COOLDOWN_MS / 1000 }, 429);
  return c.json({ id, body: msg.body, edited_at: at });
});

// a short or missing ADMIN_TOKEN locks the inbox instead of leaving it guessable; compared in constant time
app.use('/admin/*', bearerAuth({ verifyToken: async (t, c) => {
  const want = enc.encode((c.env as Env).ADMIN_TOKEN ?? ''), got = enc.encode(t);
  return want.length >= 32 && got.length === want.length && crypto.subtle.timingSafeEqual(got, want);
} }));

// the inbox: the latest 100, uncached
app.get('/admin/messages', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, name, body, link, created_at, edited_at FROM messages ORDER BY created_at DESC LIMIT 100').all();
  return c.json({ items: results });
});

app.post('/admin/messages/:id/link', async (c) => {
  const body = await c.req.json<{ link?: unknown }>().catch(() => ({}) as { link?: unknown });
  const link = checkLink(body.link);
  if (link === false) return c.json({ error: 'Profile links must be https:// addresses.' }, 400);
  const r = await c.env.DB.prepare('UPDATE messages SET link = ? WHERE id = ?').bind(link, Number(c.req.param('id'))).run();
  return r.meta.changes ? c.json({ ok: true }) : c.json({ error: 'Not found.' }, 404);
});

app.delete('/admin/messages/:id', async (c) => {
  const r = await c.env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(Number(c.req.param('id'))).run();
  return r.meta.changes ? c.json({ ok: true }) : c.json({ error: 'Not found.' }, 404);
});

export default app;
