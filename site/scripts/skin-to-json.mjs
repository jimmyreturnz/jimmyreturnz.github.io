// Reads the owner's osu! skin (skin.ini [Mania] sections for 4K and 7K) and copies only the images those layouts use into
// assets/skin/mania/, plus a mania.json config, so the site draws the playfield exactly like osu!.
// usage: node scripts/skin-to-json.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
const SKIN = 'D:/osu!/Skins/- jimmyreturnz_taiko_fade_norm/', OUT = '../assets/skin/mania/';
mkdirSync(OUT, { recursive: true });
const lines = readFileSync(SKIN + "skin.ini", "utf8").split(/\r?\n/).map((l) => l.trim());
// the [Mania] section whose "Keys:" matches, as { Key: value }
const section = (keys) => {
  const o = {}; let on = false, hit = false;
  for (const l of lines) {
    if (l.startsWith("[")) { on = l === "[Mania]"; hit = false; continue; }
    if (!on) continue;
    const c = l.indexOf(":"); if (c < 0 || l.startsWith("//")) continue;
    const key = l.slice(0, c).trim(), val = l.slice(c + 1).trim();
    if (key === "Keys") { hit = Number(val) === keys; if (hit) for (const k of Object.keys(o)) delete o[k]; continue; }
    if (hit) o[key] = val;
  }
  return o;
};
const copied = new Set();
const img = (name) => { // skin name -> published file, or null (_blank / missing)
  if (!name || name === '_blank') return null;
  const rel = name.split(String.fromCharCode(92)).join('/'), p = [`${SKIN}${rel}.png`].find(existsSync);
  if (!p) return null;
  const flat = rel.replace(/[^A-Za-z0-9._-]+/g, '_') + '.png';
  if (!copied.has(flat)) { copyFileSync(p, OUT + flat); copied.add(flat); }
  return flat;
};
const frames = (base) => { // lightingN-0, -1, ... or the still lightingN.png
  const out = []; for (let i = 0; existsSync(`${SKIN}${base}-${i}.png`); i++) out.push(img(`${base}-${i}`));
  return out.length ? out : [img(base)].filter(Boolean);
};
const nums = (s, n, d) => (s ? s.split(',').map(Number) : []).concat(Array(n).fill(d)).slice(0, n);
const LAYOUT = { 4: ['1', '2', '2', '1'], 7: ['1', '2', '1', 'S', '1', '2', '1'] }; // osu!'s default key/note pairing
const out = {};
for (const k of [4, 7]) {
  const s = section(k), cols = LAYOUT[k], g = (key) => s[key];
  const colours = Array.from({ length: k }, (_, i) => (g(`Colour${i + 1}`) ?? '0,0,0,255').split(',').map(Number));
  const light = Array.from({ length: k }, (_, i) => (g(`ColourLight${i + 1}`) ?? '55,255,255').split(',').map(Number));
  out[`k${k}`] = {
    columnStart: Number(g('ColumnStart') ?? 136), columnWidth: nums(g('ColumnWidth'), k, 30), columnSpacing: nums(g('ColumnSpacing'), k - 1, 0),
    columnLineWidth: nums(g('ColumnLineWidth'), k + 1, 2), hitPosition: Number(g('HitPosition') ?? 402), lightPosition: Number(g('LightPosition') ?? 413),
    keysUnderNotes: g('KeysUnderNotes') === '1', judgementLine: g('JudgementLine') === '1', upsideDown: g('UpsideDown') === '1',
    colourColumnLine: (g('ColourColumnLine') ?? '255,255,255,255').split(',').map(Number), colourBarline: (g('ColourBarline') ?? '255,255,255,255').split(',').map(Number),
    colours, colourLight: light,
    keys: cols.map((t, i) => [img(g(`KeyImage${i}`) ?? `mania-key${t}`), img(g(`KeyImage${i}D`) ?? `mania-key${t}D`)]),
    notes: cols.map((t, i) => ({
      n: img(g(`NoteImage${i}`) ?? `mania-note${t}`), h: img(g(`NoteImage${i}H`) ?? `mania-note${t}H`),
      l: img(g(`NoteImage${i}L`) ?? `mania-note${t}L`), t: img(g(`NoteImage${i}T`) ?? `mania-note${t}T`),
    })),
    stage: { left: img(g('StageLeft') ?? 'mania-stage-left'), right: img(g('StageRight') ?? 'mania-stage-right'), bottom: img(g('StageBottom') ?? 'mania-stage-bottom'),
             hint: img(g('StageHint') ?? 'mania-stage-hint'), light: frames(g('StageLight') ?? 'mania-stage-light') },
    lightingN: g('LightingN') === '_blank' ? [] : frames(g('LightingN') ?? 'lightingN'), lightingL: g('LightingL') === '_blank' ? [] : frames(g('LightingL') ?? 'lightingL'),
  };
}
writeFileSync('../assets/skin/mania.json', JSON.stringify(out));
console.log([...copied].length, 'images;', JSON.stringify(out.k4.notes[0]), JSON.stringify(out.k7.notes[3]), out.k7.stage.hint, out.k4.stage.hint);
