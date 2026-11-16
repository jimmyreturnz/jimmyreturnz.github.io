// Converts local .osu files to notes-only JSON (no metadata/background/audio), served from /charts/.
// usage: node scripts/osu-to-notes.mjs   (paths below; .osu files themselves never enter the repo)
import { readFileSync, writeFileSync } from 'node:fs';
const S = 'D:/osu!/Songs/';
const JOBS = [
  ['circles-of-death', S + 'beatmap-638873845460873625-audio/Camellia - Circles of Death (jimmyreturnz) [Planet of Death].osu'],
  ['quaoar', S + 'Camellia - Quaoar/Camellia - Quaoar (jimmyreturnz) [To the star].osu'],
  ['under-construction', S + '1122675 Camellia - __ Under Construction __/Camellia -  Under Construction  (LostCool) [incompleteness].osu'],
];
const sec = (txt, n) => (txt.split(new RegExp('^\\[' + n + '\\]', 'm'))[1] ?? '').split(/^\[/m)[0].trim().split(/\r?\n/).filter(Boolean);
for (const [id, file] of JOBS) {
  const t = readFileSync(file, 'utf8');
  const mode = Number(/^Mode:\s*(\d)/m.exec(t)[1]), keys = Number(/^CircleSize:\s*([\d.]+)/m.exec(t)[1]);
  const sm = Number(/^SliderMultiplier:\s*([\d.]+)/m.exec(t)[1]);
  const tp = sec(t, 'TimingPoints').map((l) => l.split(',').map(Number)).sort((a, b) => a[0] - b[0]);
  const reds = tp.filter((p) => p[6] !== 0 || p.length < 7);
  const at = (time) => { // active redline bpm + green-line sv at time
    let bl = reds[0][1], sv = 1;
    for (const p of tp) { if (p[0] > time) break; if (p[6] === 0 && p.length >= 7) sv = Math.min(10, Math.max(0.1, -100 / p[1])); else { bl = p[1]; sv = 1; } }
    return { bl, sv };
  };
  // taiko scroll position: speed follows redline BPM x green-line SV (like osu!taiko / taikoeditor); mania scrolls at constant speed
  const knots = [], K = 1 / 200; let pos = 0, lastT = tp[0][0], v = 0;
  const speed = (time) => { const { bl, sv } = at(time); return (60000 / bl) * sv * K; };
  const times = [...new Set(tp.map((p) => p[0]))];
  let prev = null;
  for (const time of times) { if (prev !== null) pos += v * (time - prev); v = speed(time + 0.001); knots.push([time, +pos.toFixed(4), +v.toFixed(5)]); prev = time; }
  const posAt = (time) => { let k = knots[0]; for (const x of knots) { if (x[0] > time) break; k = x; } return k[1] + k[2] * (time - k[0]); };
  const notes = [];
  for (const l of sec(t, 'HitObjects')) {
    const f = l.split(','), x = +f[0], time = +f[2], type = +f[3], hs = +f[4];
    if (mode === 3) {
      const lane = Math.min(keys - 1, Math.floor((x * keys) / 512));
      notes.push(type & 128 ? [time, lane, Math.round(+f[5].split(':')[0])] : [time, lane, 0]);
    } else if (type & 2) { // drumroll: [time, 2, endTime]
      const { bl, sv } = at(time), end = time + (+f[7] * +f[6]) / (sm * 100 * sv) * bl;
      notes.push([time, 2, Math.round(end), +posAt(time).toFixed(4), +posAt(end).toFixed(4)]);
    } else if (type & 8) notes.push([time, 3, +f[5], +posAt(time).toFixed(4)]);
    else notes.push([time, hs & 10 ? 1 : 0, hs & 4 ? 1 : 0, +posAt(time).toFixed(4)]); // [t, 0don|1kat, big, pos]
  }
  const bars = reds.map((p) => [p[0], p[1], p[2] || 4]);
  writeFileSync(`../assets/charts/${id}.json`, JSON.stringify({ mode: mode === 3 ? 'mania' : 'taiko', keys, bars, knots: mode === 3 ? [] : knots, notes }));
  console.log(id, mode, keys, notes.length, 'notes', reds.length, 'redlines');
}
