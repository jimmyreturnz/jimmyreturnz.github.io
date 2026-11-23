// All page content in one place. `null` = not known yet; the page shows a striped placeholder.
// Later this moves into Sveltia CMS collections (see docs/FEATURES.md).

export const profile = {
  handle: 'jimmyreturnz',
  nickname: 'Jimmy',
  fullName: 'Apiwat Kongsawat',
  role: 'Data Scientist & Developer',
  aspiration: 'on my way to AI Engineer',
  bio: [
    'I build data and ML tools for the production team at BMW Group in Rayong, such as a shipment tracker that cut airfreight cost by 15% and an OCR system for the line.',
    'You might also know me from osu!taiko, osu!mania or TETR.IO, and I’m a big fan of hardcore EDM.',
  ],
  study: 'Mahidol University, graduating 2027',
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
};


export type Project = {
  title: string;
  pinned?: boolean;
  tags: ('data' | 'dev' | 'work' | 'open source')[];
  /** one plain sentence: what it does, for whom */
  summary: string;
  outcome: { value: string | null; text: string | null };
  stack: string | null;
  role: string | null;
  link: { label: string; href: string } | null;
  note?: string;
  cover: 'sky' | 'mint' | 'pink' | 'lav' | 'butter';
  icon: string; // vectorheart symbol id
  logo?: string; // the project's own logo (shown instead of the icon)
};

export const projects: Project[] = [
  { title: 'Shipment Tracking', pinned: true, tags: ['data', 'work'], cover: 'sky', icon: 'vh-ship',
    summary: 'Tracks inbound sea containers, predicts which will arrive late from carrier plans, vessel positions and weather, and alerts the team early.',
    outcome: { value: '−35%', text: 'chance of a line stop from late parts, and 15% lower airfreight cost' },
    stack: 'Python · pandas · web scraping · Power Automate', role: 'Data Scientist intern, BMW Group', link: null, note: 'code private' },
  { title: 'Production-scale OCR', pinned: true, tags: ['data', 'work'], cover: 'mint', icon: 'vh-camera',
    summary: 'Reads hand-stamped codes on cast parts from the line camera, checks them against the PLC in seconds, and rejects any code it isn’t sure of.',
    outcome: { value: '≥ ฿500k', text: 'saved compared with buying a dedicated vision system' },
    stack: 'Python · PaddleOCR · OPC UA / PLC · offline installer', role: 'Data Scientist intern, BMW Group', link: null, note: 'code private' },
  // download and star counts as of 2026-11-22 (GitHub releases)
  { title: 'KatsuDon Editor', pinned: true, tags: ['dev', 'open source'], cover: 'butter', icon: 'vh-chevrons', logo: '/projects/katsudon-logo.svg',
    summary: 'A desktop osu!taiko editor that arranges notes into shapes for gimmick charts, so mappers don’t place every note by hand.',
    outcome: { value: '258', text: 'downloads and 12 stars on GitHub' },
    stack: 'Python · PySide6 · PyInstaller', role: 'Solo',
    link: { label: 'GitHub ↗', href: 'https://github.com/jimmyreturnz/KatsuDonEditor' } },
];

// Only skills the owner has used in real work and can defend in an interview (reviewed 2026-11-22). "Learning" = understood, not yet used for real.
export const skills: { group: string; items: string[] }[] = [
  { group: 'Data & ML', items: ['Python', 'pandas', 'Machine learning (classical)', 'SQL', 'Statistics', 'Exploratory data analysis', 'OCR (fine-tuned PaddleOCR)', 'Web scraping'] },
  { group: 'Apps & tools', items: ['Packaging & releases (PyInstaller)', 'Automation (Python + SMTP)', 'Git / GitHub', 'HTML / CSS'] },
  { group: 'Learning', items: ['Deep learning (PyTorch)'] },
];

/** osu!lazer mania: a note's fall time to the hit line is MANIA_MAX_TIME_RANGE / scroll speed (ms). */
export const MANIA_MAX_TIME_RANGE = 11485;
export const maniaScrollSpeed = { '4k': 29, '7k': 32 } as const;
export const maniaScrollTimeMs = (speed: number) => Math.round(MANIA_MAX_TIME_RANGE / speed);

export const camelliaUrl = 'https://cametek.jp/';

/** Background music (Portfolio header). Title format: original artist - song title. Arranger is credited separately. */
export const bgm = {
  file: '/audio/ZUN-Pure_Furies.m4a', lufs: -14.2,
  artist: 'ZUN', title: 'Pure Furies ~ Whereabouts of the Heart', game: 'Touhou 15: Legacy of Lunatic Kingdom',
  arranger: 'Nnwt', arrangementUrl: 'https://www.youtube.com/watch?v=dSnTgNsFi1I',
  /** Nnwt's description offers the MP3/MIDI/PDF for download and says to change it freely; keep that link if anyone asks. */
  note: 'piano arrangement, shared by the arranger with the MP3 download',
};

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
  /** integrated loudness of the song file in LUFS (measured with ffmpeg ebur128); the player turns it down to the site's target */
  lufs: number;
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
    keys: 'C V , .', audio: 'Camellia-Circles_of_Death', lufs: -4.1, osu: 'circles-of-death-taiko.osu',
  },
  mania4k: {
    id: 'quaoar', mode: 'mania', keyMode: '4k',
    artist: 'かめりあ', artistLatin: 'Camellia', title: 'Quaoar', album: null,
    mapper: 'jimmyreturnz', ownMap: true, permission: null,
    songUrl: 'https://www.youtube.com/watch?v=yjQmZBvi3WE',
    // Beatmapset 1203155 has [4K] To the star (2857557), [4K] Insane (3269223) and [18K] komi im sorry (3579522).
    beatmapUrl: 'https://osu.ppy.sh/beatmapsets/1203155#mania/2857557',
    difficulty: '[4K] To the star', stars: 5.43, bpm: 174, lengthSec: 275,
    keys: 'C V , .', scrollSpeed: maniaScrollSpeed['4k'], audio: 'Camellia-Quaoar', lufs: -8.2, osu: 'quaoar-4k.osu',
  },
  mania7k: {
    id: 'under-construction', mode: 'mania', keyMode: '7k',
    artist: 'Camellia', artistLatin: 'Camellia', title: '// Under Construction //', album: 'Blackmagik Blazing',
    mapper: 'LostCool', ownMap: false, permission: 'used with permission',
    songUrl: 'https://cametek.bandcamp.com/track/under-construxion',
    beatmapUrl: 'https://osu.ppy.sh/beatmapsets/1122675#mania/2346118',
    difficulty: '[7K] incompleteness', stars: 11.41, bpm: 157.5, lengthSec: 280,
    keys: 'S D F Space J K L', scrollSpeed: maniaScrollSpeed['7k'], audio: 'Camellia-Under_Construction', lufs: -3.6, osu: 'under-construction-7k.osu',
  },
};

export const setups: { group: string; items: { label: string; value: string | null }[] }[] = [
  { group: 'osu!taiko', items: [{ label: 'Keys', value: 'C V , .' }, { label: 'Keyboard', value: 'Keychron K10' }] },
  { group: 'osu!mania', items: [{ label: 'Keys (4K)', value: 'C V , .' }, { label: 'Keys (7K)', value: 'S D F Space J K L' }, { label: 'Keyboard', value: 'Keychron K10' }, { label: 'Scroll speed', value: '29 (4K) · 32 (7K)' }] },
  { group: 'TETR.IO', items: [{ label: 'Handling', value: 'DAS 4.2 · ARR 0 · DCD 0.1 · SDF ∞' }] },
];

/** Dates are 'YYYY-MM' (inclusive months); `to: null` = still going. Source: the owner's LinkedIn + own words. `lane` = row on the ruler. */
export type Moment = { what: string; short: string; where: string; blurb?: string; from: string; to: string | null; expected?: boolean; lane: 0 | 1 | 2; highlight?: boolean };
export const timeline: Moment[] = [
  { what: 'Triam Udom Suksa Pattanakarn School', short: 'Triam Udom Suksa Pattanakarn', where: 'High school · Intensive English + Science and Mathematics Program', from: '2017-05', to: '2023-02', lane: 0 },
  { what: 'Mahidol University', short: 'Mahidol University', where: 'Bachelor’s degree, Industrial Mathematics and Data Science', from: '2023-08', to: '2027-05', expected: true, lane: 0 },
  { what: 'MU Mental Math Competition', short: 'MU Mental Math Competition', where: 'Founder & Project Manager · Mahidol University', highlight: true, lane: 1, from: '2024-04', to: null,
    blurb: '700+ participants from 100+ schools across Thailand. Python and Google Sheets workflows cut manual processing time by 67%.' },
  { what: 'Data Scientist (Internship)', short: 'BMW Group', where: 'BMW Group · Rayong, Thailand · Production team of BMW Parts Manufacturing', from: '2026-06', to: null, lane: 2 },
];

export const shoutouts: { name: string; quote: string | null; link: string | null }[] = [];
