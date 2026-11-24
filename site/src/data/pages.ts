// The Portfolio's pages, in nav order. The Lobby (/) sits in front of these.
export const pages = [
  { href: '/about/', label: 'About', tint: 'grape' },
  { href: '/projects/', label: 'Projects', tint: 'butter' },
  { href: '/rhythm/', label: 'osu!', tint: 'pink' },
  { href: '/tetrio/', label: 'TETR.IO', tint: 'sky' },
  { href: '/shoutouts/', label: 'Shoutouts', tint: 'lav' },
] as const;
