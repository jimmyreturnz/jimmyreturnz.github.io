// Message Board API (Hono on Cloudflare Workers, data in D1). See schema.sql and README.md.
//   GET  /messages?page=1            messages, newest first, 20 a page
//   POST /messages {name, message, token}   a new message, public straight away once it passes the checks (owner, 2026-11-23)
//   POST /admin/messages/:id/link {link?}   attach or clear a profile link   (Authorization: Bearer ADMIN_TOKEN)
//   DELETE /admin/messages/:id                                               (same)
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bearerAuth } from 'hono/bearer-auth';
import { checkMessage, checkLink, PAGE_SIZE } from './rules';

type Env = { DB: D1Database; ALLOWED_ORIGINS: string; TURNSTILE_SECRET: string; VISITOR_SECRET: string; ADMIN_TOKEN: string };
const app = new Hono<{ Bindings: Env }>();

app.use('*', (c, next) => cors({ origin: c.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()), allowMethods: ['GET', 'POST', 'DELETE'], allowHeaders: ['Content-Type', 'Authorization'], maxAge: 86400 })(c, next));

const enc = new TextEncoder();
const hmac = async (key: string, data: string) => {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(data)))].map((b) => b.toString(16).padStart(2, '0')).join('');
};
/** The visitor's fingerprint for today: HMAC of the IP under a key derived from the secret and today's date (UTC), so it can't be
 *  reversed or linked across days. The raw IP is never stored. */
const visitorId = async (secret: string, ip: string) => hmac(await hmac(secret, new Date().toISOString().slice(0, 10)), ip);

const turnstileOk = async (secret: string, token: unknown, ip: string) => {
  if (typeof token !== 'string' || !token) return false;
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret, response: token, remoteip: ip }) });
  return ((await r.json()) as { success?: boolean }).success === true;
};

app.get('/messages', async (c) => {
  const page = Math.max(1, Math.min(1000, Number(c.req.query('page')) || 1));
  const { results } = await c.env.DB.prepare('SELECT id, name, body, link, created_at FROM messages WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
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
  // one message a day per visitor
  const seen = await c.env.DB.prepare('SELECT 1 FROM messages WHERE visitor = ? LIMIT 1').bind(visitor).first();
  if (seen) return c.json({ error: 'You’ve already sent a message today. Thank you!' }, 429);
  const at = Date.now();
  const row = await c.env.DB.prepare('INSERT INTO messages (name, body, status, visitor, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id').bind(msg.name, msg.body, 'approved', visitor, at).first<{ id: number }>();
  return c.json({ id: row?.id, name: msg.name, body: msg.body, link: null, created_at: at }, 201); // as stored, so the page shows exactly what others will see
});

app.use('/admin/*', bearerAuth({ verifyToken: async (t, c) => { const want = (c.env as Env).ADMIN_TOKEN; return !!want && t === want; } }));

// the inbox: the latest 100, uncached
app.get('/admin/messages', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, name, body, link, created_at FROM messages ORDER BY created_at DESC LIMIT 100').all();
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
