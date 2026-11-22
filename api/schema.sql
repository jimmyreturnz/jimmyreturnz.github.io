-- Message Board. Run with `bun run db:local` (dev) or `bun run db:remote` (production). Safe to run again.
CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,                     -- whatever the visitor typed, shown as plain text
  body       TEXT NOT NULL,                     -- max 1000 characters, no links
  status     TEXT NOT NULL DEFAULT 'approved',  -- messages go public straight away; kept so hiding without deleting stays possible
  link       TEXT,                              -- profile link the owner attaches by hand while approving
  visitor    TEXT NOT NULL,                     -- HMAC of the IP with a key that changes daily; never the IP
  created_at INTEGER NOT NULL                   -- unix ms
);
CREATE INDEX IF NOT EXISTS messages_board ON messages (status, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_visitor ON messages (visitor);
