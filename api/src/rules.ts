// Message Board input rules, kept free of Worker APIs so they can be tested with plain Node.

export const MAX_NAME = 40, MAX_BODY = 1000, PAGE_SIZE = 20;

// anything that looks like a link: a scheme, www., or a dotted domain with a common ending (also "example . com")
const LINK = /(https?:|ftp:|www\.|\b[a-z0-9-]+\s*\.\s*(com|net|org|io|gg|me|dev|app|xyz|co|th|jp|ly|link|site|ru|cn|tk|info|biz)\b|discord\.gg|t\.me\/)/i;

const chars = (s: string) => [...s].length; // count characters, not UTF-16 units (Thai, Japanese, emoji)
const clean = (s: unknown) => (typeof s === 'string' ? s.normalize('NFC').replace(/[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').trim() : '');

export type Checked = { ok: true; name: string; body: string } | { ok: false; error: string };

export function checkMessage(input: { name?: unknown; message?: unknown }): Checked {
  const name = clean(input.name).replace(/\s+/g, ' '), body = clean(input.message).replace(/\n{3,}/g, '\n\n');
  if (!name) return { ok: false, error: 'Please type a name.' };
  if (chars(name) > MAX_NAME) return { ok: false, error: `Names can be up to ${MAX_NAME} characters.` };
  if (!body) return { ok: false, error: 'Please write a message.' };
  if (chars(body) > MAX_BODY) return { ok: false, error: `Messages can be up to ${MAX_BODY} characters.` };
  if (LINK.test(name) || LINK.test(body)) return { ok: false, error: 'Links aren’t allowed here.' };
  return { ok: true, name, body };
}

/** Owner-attached profile links: https only, a real host, no credentials. */
export function checkLink(v: unknown): string | null | false {
  if (v == null || v === '') return null;
  if (typeof v !== 'string') return false;
  try { const u = new URL(v); return u.protocol === 'https:' && u.hostname.includes('.') && !u.username && !u.password ? u.href : false; } catch { return false; }
}
