// All page content in one place. `null` = not known yet; the page shows a striped placeholder.
// Later this moves into Sveltia CMS collections (see docs/FEATURES.md).

export const profile = {
  handle: 'jimmyreturnz',
  nickname: 'Jimmy',
  fullName: 'Apiwat Kongsawat',
  role: 'Data Scientist & Developer',
  aspiration: 'on my way to AI Engineer',
  bio: [
    'I create ML projects, including Shipment Tracking, a production-scale OCR project, and more!',
    'You might also know me from osu!taiko, osu!mania or TETR.IO, and I’m a big fan of hardcore EDM.',
  ],
  location: 'Bangkok, Thailand' as string | null,
  languages: 'TH / EN / JP (ちょっと)',
  openTo: 'Data Scientist positions' as string | null,
  email: 'apiwatkon.rtz@gmail.com',
  links: {
    github: 'https://github.com/jimmyreturnz',
    linkedin: null as string | null,
    instagram: 'https://www.instagram.com/jimmyreturnz/' as string | null,
    discord: 'https://discord.com/users/240829609879273472' as string | null, // @jimmyreturnz
    facebook: null as string | null,
    /** Paste a SoundCloud playlist or track URL to show the embedded player. */
    soundcloud: null as string | null,
  },
};

/** Stats Card numbers for osu! and TETR.IO come from stats.json (scripts/fetch-stats.ts). */
export const github = {
  url: 'https://github.com/jimmyreturnz',
  publicRepos: 8,
  followers: 6,
  commitsThisYear: null as number | null,
  topLanguages: [
    { name: 'Python', share: 46 },
    { name: 'Jupyter', share: 24 },
    { name: 'SQL', share: 18 },
    { name: 'TypeScript', share: 12 },
  ],
  languagesAreSample: true,
};


export type Project = {
  title: string;
  pinned?: boolean;
  tags: ('data' | 'dev' | 'BMW' | 'internship' | 'open source')[];
  outcome: { value: string | null; text: string | null };
  stack: string | null;
  role: string | null;
  link: { label: string; href: string } | null;
  note?: string;
  cover: 'sky' | 'mint' | 'pink' | 'lav' | 'butter';
  icon: string; // vectorheart symbol id
};

export const projects: Project[] = [
  { title: 'Shipment Tracking', pinned: true, tags: ['data', 'BMW'], cover: 'sky', icon: 'vh-eq',
    outcome: { value: null, text: null }, stack: null, role: null, link: null, note: 'code private' },
  { title: 'Production-scale OCR', pinned: true, tags: ['data', 'BMW'], cover: 'mint', icon: 'vh-target',
    outcome: { value: null, text: null }, stack: null, role: null, link: null, note: 'code private' },
  { title: 'This portfolio', tags: ['dev', 'open source'], cover: 'pink', icon: 'vh-heart-target',
    outcome: { value: '60fps', text: 'target on a mid-range phone, with two playable osu! charts' },
    stack: 'Astro · TypeScript · GSAP · Hono · Cloudflare', role: 'Solo',
    link: { label: 'GitHub ↗', href: 'https://github.com/jimmyreturnz/jimmyreturnz.github.io' } },
];

export const skills: { group: string; items: string[] }[] = [
  { group: 'Data & ML', items: ['Python', 'OCR', 'Machine learning'] },
  { group: 'Data engineering', items: ['SQL'] },
  { group: 'Web', items: ['TypeScript', 'Astro'] },
];

export const charts = {
  taiko: {
    artist: 'Camellia', title: 'Circles of Death', mapper: 'jimmyreturnz',
    beatmapUrl: 'https://osu.ppy.sh/beatmapsets/2404655#taiko/5216517',
    keys: 'D F J K',
  },
  mania: {
    artist: 'かめりあ', title: 'Quaoar', mapper: 'jimmyreturnz',
    beatmapUrl: 'https://osu.ppy.sh/beatmapsets/1203155#mania/3579522',
    keys: 'D F J K',
  },
};

export const setups: { group: string; items: { label: string; value: string | null }[] }[] = [
  { group: 'osu!taiko', items: [{ label: 'Keys', value: null }, { label: 'Keyboard', value: null }] },
  { group: 'osu!mania 4K', items: [{ label: 'Keys', value: null }, { label: 'Scroll speed', value: null }] },
  { group: 'TETR.IO', items: [{ label: 'ARR / DAS / SDF', value: null }, { label: 'Controls', value: null }] },
];

export const timeline: { when: string | null; what: string; where: string | null }[] = [
  { when: null, what: 'High school', where: null },
  { when: null, what: 'University', where: null },
  { when: null, what: 'Internship', where: null },
  { when: null, what: 'Career', where: null },
];

export const shoutouts: { name: string; quote: string | null; link: string | null }[] = [];
