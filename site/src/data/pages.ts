// The Portfolio's pages, in nav order. The Lobby (/) sits in front of these.
export const pages = [
  { href: '/about/', label: 'About', tint: 'mint' },
  { href: '/projects/', label: 'Projects', tint: 'butter' },
  { href: '/rhythm/', label: 'osu!', tint: 'pink' },
  { href: '/tetrio/', label: 'TETR.IO', tint: 'sky' },
  // Community (/community/) stays out of the nav until it has shoutouts or the Message Board API is live.
] as const;
