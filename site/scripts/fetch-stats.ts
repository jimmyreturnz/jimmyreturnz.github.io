// Fetches Stats Card data at build time (runs before `astro build`; a daily job rebuilds the site).
// - TETR.IO: public API, no key.
// - osu!: uses API v2 when OSU_CLIENT_ID + OSU_CLIENT_SECRET are set (client-credentials app from
//   https://osu.ppy.sh/home/account/edit#oauth). Otherwise reads the public profile pages
//   (osu.ppy.sh/users/<id>/<mode>), whose embedded data has the same shape. One request per mode per build.
// Writes src/data/stats.json (committed as the fallback snapshot) and avatars to ../assets/stats/.
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const OSU_USER_ID = 11306153;
const TETRIO_USER = 'jimmyreturnz';
const UA = 'jimmyreturnz-portfolio-build (+https://github.com/jimmyreturnz/jimmyreturnz.github.io)';
const OUT = new URL('../src/data/stats.json', import.meta.url);
const AVATAR_DIR = new URL('../../assets/stats/', import.meta.url);

type Rank = number | null;
export type OsuMode = {
  globalRank: Rank; countryRank: Rank; pp: number | null; accuracy: number | null;
  playCount: number | null; playTimeHours: number | null; level: number | null;
  fourK?: OsuVariant;
  sevenK?: OsuVariant;
};
export type OsuVariant = { globalRank: Rank; countryRank: Rank; pp: number | null };
export type Stats = {
  fetchedAt: string | null;
  osu: { fetchedAt: string | null; username: string; userId: number; profileUrl: string; avatar: string | null;
         country: string | null; taiko: OsuMode | null; mania: OsuMode | null };
  tetrio: { fetchedAt: string | null; username: string; profileUrl: string; avatar: string | null; country: string | null;
            level: number | null; playTimeHours: number | null; gamesPlayed: number | null; gamesWon: number | null;
            league: { rank: string | null; bestRank: string | null; tr: number | null; globalRank: Rank; countryRank: Rank;
                      apm: number | null; pps: number | null; vs: number | null } | null };
};

const empty: Stats = {
  fetchedAt: null,
  osu: { fetchedAt: null, username: 'jimmyreturnz', userId: OSU_USER_ID, profileUrl: `https://osu.ppy.sh/users/${OSU_USER_ID}`,
         avatar: null, country: null, taiko: null, mania: null },
  tetrio: { fetchedAt: null, username: TETRIO_USER, profileUrl: `https://ch.tetr.io/u/${TETRIO_USER}`, avatar: null, country: null,
            level: null, playTimeHours: null, gamesPlayed: null, gamesWon: null, league: null },
};

async function getJson(url: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, Accept: 'application/json', ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json() as Promise<any>;
}

async function saveImage(url: string, name: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') ?? '';
    const ext = type.includes('png') ? 'png' : type.includes('gif') ? 'gif' : type.includes('webp') ? 'webp' : 'jpg';
    await mkdir(AVATAR_DIR, { recursive: true });
    await writeFile(new URL(`${name}.${ext}`, AVATAR_DIR), new Uint8Array(await res.arrayBuffer()));
    return `/stats/${name}.${ext}`;
  } catch (e) {
    console.warn(`  avatar ${name}: ${(e as Error).message}`);
    return null;
  }
}

/** TETR.IO level from XP (community formula; TETR.IO doesn't expose level directly). */
const tetrioLevel = (xp: number) => Math.pow(xp / 500, 0.6) + xp / (5000 + Math.max(0, xp - 4_000_000) / 5000) + 1;

async function fetchTetrio(prev: Stats['tetrio']): Promise<Stats['tetrio']> {
  const u = (await getJson(`https://ch.tetr.io/api/users/${TETRIO_USER}`)).data;
  const l = (await getJson(`https://ch.tetr.io/api/users/${TETRIO_USER}/summaries/league`)).data;
  const avatar = u.avatar_revision
    ? await saveImage(`https://tetr.io/user-content/avatars/${u._id}.jpg?rv=${u.avatar_revision}`, 'tetrio-avatar')
    : null;
  const num = (v: unknown) => (typeof v === 'number' && v >= 0 ? v : null);
  return {
    ...prev,
    fetchedAt: new Date().toISOString(),
    avatar: avatar ?? prev.avatar,
    country: u.country ?? null,
    level: typeof u.xp === 'number' ? Math.floor(tetrioLevel(u.xp)) : null,
    playTimeHours: typeof u.gametime === 'number' && u.gametime >= 0 ? Math.round(u.gametime / 3600) : null,
    gamesPlayed: num(u.gamesplayed),
    gamesWon: num(u.gameswon),
    league: l ? {
      rank: l.rank && l.rank !== 'z' ? l.rank : null, bestRank: l.bestrank ?? null,
      tr: num(l.tr), globalRank: num(l.standing), countryRank: num(l.standing_local),
      apm: num(l.apm), pps: num(l.pps), vs: num(l.vs),
    } : null,
  };
}

/** Map an osu! `statistics` object (same shape from the API and from the profile page). */
function osuMode(s: any, mode: 'taiko' | 'mania'): OsuMode {
  s = s ?? {};
  const out: OsuMode = {
    globalRank: s.global_rank ?? null, countryRank: s.country_rank ?? null,
    pp: typeof s.pp === 'number' ? Math.round(s.pp) : null,
    accuracy: typeof s.hit_accuracy === 'number' ? Math.round(s.hit_accuracy * 100) / 100 : null,
    playCount: s.play_count ?? null,
    playTimeHours: typeof s.play_time === 'number' ? Math.round(s.play_time / 3600) : null,
    level: s.level?.current ?? null,
  };
  if (mode === 'mania') {
    const v = (k: string): OsuVariant | undefined => {
      const x = (s.variants ?? []).find((y: any) => y.variant === k);
      return x ? { globalRank: x.global_rank ?? null, countryRank: x.country_rank ?? null, pp: x.pp != null ? Math.round(x.pp) : null } : undefined;
    };
    out.fourK = v('4k');
    out.sevenK = v('7k');
  }
  return out;
}

/** Public profile page: the user object is embedded as HTML-escaped JSON in `data-initial-data`. */
async function osuProfilePage(mode: 'taiko' | 'mania'): Promise<any> {
  const res = await fetch(`https://osu.ppy.sh/users/${OSU_USER_ID}/${mode}`, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
  if (!res.ok) throw new Error(`profile page ${mode} → HTTP ${res.status}`);
  const m = (await res.text()).match(/data-initial-data="([^"]*)"/);
  if (!m) throw new Error(`profile page ${mode}: no embedded data`);
  const json = m[1]!.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  return JSON.parse(json).user;
}

async function fetchOsu(prev: Stats['osu']): Promise<Stats['osu']> {
  const avatar = (await saveImage(`https://a.ppy.sh/${OSU_USER_ID}`, 'osu-avatar')) ?? prev.avatar;
  const id = process.env.OSU_CLIENT_ID, secret = process.env.OSU_CLIENT_SECRET;
  let get: (m: 'taiko' | 'mania') => Promise<any>;
  if (id && secret) {
    const token = (await getJson('https://osu.ppy.sh/oauth/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: Number(id), client_secret: secret, grant_type: 'client_credentials', scope: 'public' }),
    })).access_token as string;
    get = (m) => getJson(`https://osu.ppy.sh/api/v2/users/${OSU_USER_ID}/${m}`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('  osu!: using API v2');
  } else {
    get = osuProfilePage;
    console.log('  osu!: no API keys, reading public profile pages');
  }
  const t = await get('taiko');
  const m = await get('mania');
  return { ...prev, fetchedAt: new Date().toISOString(), avatar, username: t.username ?? prev.username,
           country: t.country_code ?? prev.country, taiko: osuMode(t.statistics, 'taiko'), mania: osuMode(m.statistics, 'mania') };
}

async function main() {
  let prev: Stats = empty;
  try { prev = { ...empty, ...JSON.parse(await readFile(OUT, 'utf8')) }; } catch { /* first run */ }
  const next: Stats = { ...prev };
  try { next.tetrio = await fetchTetrio(prev.tetrio); console.log('  TETR.IO: ok'); }
  catch (e) { console.warn(`  TETR.IO failed, keeping last known: ${(e as Error).message}`); }
  try { next.osu = await fetchOsu(prev.osu); console.log('  osu!: ok'); }
  catch (e) { console.warn(`  osu! failed, keeping last known: ${(e as Error).message}`); }
  next.fetchedAt = new Date().toISOString();
  await writeFile(OUT, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`  wrote ${OUT.pathname}`);
}

console.log('fetch-stats:');
await main();
