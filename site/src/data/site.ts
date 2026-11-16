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
    linkedin: 'https://www.linkedin.com/in/apiwat-kongsawat-a57805227' as string | null,
    instagram: 'https://www.instagram.com/jimmyreturnz/' as string | null,
    discord: 'https://discord.com/users/240829609879273472' as string | null, // @jimmyreturnz
    facebook: 'https://www.facebook.com/jimmyreturnz' as string | null,
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

/** osu!lazer mania: a note's fall time to the hit line is MANIA_MAX_TIME_RANGE / scroll speed (ms). */
export const MANIA_MAX_TIME_RANGE = 11485;
export const maniaScrollSpeed = { '4k': 29, '7k': 32 } as const;
export const maniaScrollTimeMs = (speed: number) => Math.round(MANIA_MAX_TIME_RANGE / speed);

export const camelliaUrl = 'https://cametek.jp/';

export type Chart = {
  id: string;
  mode: 'taiko' | 'mania';
  keyMode?: '4k' | '7k';
  artist: string; artistLatin: string; title: string; album: string | null;
  mapper: string; ownMap: boolean; permission: string | null;
  /** where to hear/buy the song, when it is not the artist's main site */
  songUrl?: string;
  beatmapUrl: string; difficulty: string; stars: number; bpm: number; lengthSec: number;
  keys: string; scrollSpeed?: number;
  /** base name in assets/audio/ (expects .m4a and/or .opus) */
  audio: string;
  /** file name in assets/charts/ */
  osu: string;
};

export const charts: Record<'taiko' | 'mania4k' | 'mania7k', Chart> = {
  taiko: {
    id: 'circles-of-death', mode: 'taiko',
    artist: 'Camellia', artistLatin: 'Camellia', title: 'Circles of Death', album: null,
    mapper: 'jimmyreturnz', ownMap: true, permission: null,
    songUrl: 'https://cametek.bandcamp.com/track/circles-of-death',
    beatmapUrl: 'https://osu.ppy.sh/beatmapsets/2404655#taiko/5216517',
    difficulty: 'Planet of Death', stars: 9.57, bpm: 200, lengthSec: 204,
    keys: 'D F J K', audio: 'Camellia-Circles_of_Death', osu: 'circles-of-death-taiko.osu',
  },
  mania4k: {
    id: 'quaoar', mode: 'mania', keyMode: '4k',
    artist: 'かめりあ', artistLatin: 'Camellia', title: 'Quaoar', album: null,
    mapper: 'jimmyreturnz', ownMap: true, permission: null,
    songUrl: 'https://www.youtube.com/watch?v=yjQmZBvi3WE',
    // Beatmapset 1203155 has [4K] To the star (2857557), [4K] Insane (3269223) and [18K] komi im sorry (3579522).
    beatmapUrl: 'https://osu.ppy.sh/beatmapsets/1203155#mania/2857557',
    difficulty: '[4K] To the star', stars: 5.43, bpm: 174, lengthSec: 275,
    keys: 'D F J K', scrollSpeed: maniaScrollSpeed['4k'], audio: 'Camellia-Quaoar', osu: 'quaoar-4k.osu',
  },
  mania7k: {
    id: 'under-construction', mode: 'mania', keyMode: '7k',
    artist: 'Camellia', artistLatin: 'Camellia', title: '// Under Construction //', album: 'Blackmagik Blazing',
    mapper: 'LostCool', ownMap: false, permission: 'used with permission',
    songUrl: 'https://cametek.bandcamp.com/track/under-construxion',
    beatmapUrl: 'https://osu.ppy.sh/beatmapsets/1122675#mania/2346118',
    difficulty: '[7K] incompleteness', stars: 11.41, bpm: 157.5, lengthSec: 280,
    keys: 'S D F Space J K L', scrollSpeed: maniaScrollSpeed['7k'], audio: 'Camellia-Under_Construction', osu: 'under-construction-7k.osu',
  },
};

export const setups: { group: string; items: { label: string; value: string | null }[] }[] = [
  { group: 'osu!taiko', items: [{ label: 'Keys', value: null }, { label: 'Keyboard', value: null }] },
  { group: 'osu!mania', items: [{ label: 'Keys (4K)', value: null }, { label: 'Scroll speed', value: '29 (4K) · 32 (7K)' }] },
  { group: 'TETR.IO', items: [{ label: 'ARR / DAS / SDF', value: null }, { label: 'Controls', value: null }] },
];

export const timeline: { when: string | null; what: string; where: string | null }[] = [
  { when: null, what: 'High school', where: null },
  { when: null, what: 'University', where: null },
  { when: null, what: 'Internship', where: null },
  { when: null, what: 'Career', where: null },
];

export const shoutouts: { name: string; quote: string | null; link: string | null }[] = [];
