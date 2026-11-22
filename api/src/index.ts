// Message Board API (Hono on Cloudflare Workers, data in D1). See schema.sql and README.md.
//   GET  /messages?page=1            approved messages, newest first, 20 a page
//   POST /messages {name, message, token}   a new message, pending until the owner approves it
//   GET  /admin/messages             pending messages            (Authorization: Bearer ADMIN_TOKEN)
//   POST /admin/messages/:id/approve {link?}                    (same)
//   DELETE /admin/messages/:id                                  (same)
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
  c.header('Cache-Control', 'public, max-age=60');
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
  // one message a day per visitor, which also means one pending at a time within the day
  const seen = await c.env.DB.prepare('SELECT 1 FROM messages WHERE visitor = ? LIMIT 1').bind(visitor).first();
  if (seen) return c.json({ error: 'You’ve already sent a message today. Thank you!' }, 429);
  await c.env.DB.prepare('INSERT INTO messages (name, body, visitor, created_at) VALUES (?, ?, ?, ?)').bind(msg.name, msg.body, visitor, Date.now()).run();
  return c.json({ ok: true }, 201);
});

app.use('/admin/*', bearerAuth({ verifyToken: async (t, c) => { const want = (c.env as Env).ADMIN_TOKEN; return !!want && t === want; } }));

app.get('/admin/messages', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, name, body, created_at FROM messages WHERE status = ? ORDER BY created_at ASC LIMIT 100').bind('pending').all();
  return c.json({ items: results });
});

app.post('/admin/messages/:id/approve', async (c) => {
  const body = await c.req.json<{ link?: unknown }>().catch(() => ({}) as { link?: unknown });
  const link = checkLink(body.link);
  if (link === false) return c.json({ error: 'Profile links must be https:// addresses.' }, 400);
  const r = await c.env.DB.prepare('UPDATE messages SET status = ?, link = ? WHERE id = ?').bind('approved', link, Number(c.req.param('id'))).run();
  return r.meta.changes ? c.json({ ok: true }) : c.json({ error: 'Not found.' }, 404);
});

app.delete('/admin/messages/:id', async (c) => {
  const r = await c.env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(Number(c.req.param('id'))).run();
  return r.meta.changes ? c.json({ ok: true }) : c.json({ error: 'Not found.' }, 404);
});

export default app;
