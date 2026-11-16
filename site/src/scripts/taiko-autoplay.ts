// Taiko autoplay hands, ported from KatsuDon Editor `chart/autoplay.py` (kddk, full alt, binding 1234).
// Halves are numbered as players write them: 1 left kat, 2 left don, 3 right don, 4 right kat.
// Full alt: strict R/L alternation through every rest; only a break of 4+ beats restarts on the dominant (right) hand.
// ponytail: only the editor's default style (full alt). Semi alt / single tap / roll / ddkk and bindings 1324/4231
// are in autoplay.py if the site ever needs them.
export type Note = { time: number; kat: boolean; big: boolean };

export function noteHalves(notes: Note[], beatMs: number): number[][] {
  const out: number[][] = [];
  let hand = 0; // 0 = dominant (right), 1 = left
  for (let i = 0; i < notes.length; i++) {
    const gap = i ? notes[i].time - notes[i - 1].time : Infinity;
    // a rest is half a beat or more; a hair under counts (snapped ms are truncated)
    const newGroup = gap >= beatMs / 2 - 1;
    if (i === 0 || (newGroup && gap >= 4 * beatMs)) hand = 0; else hand = 1 - hand;
    const { kat, big } = notes[i];
    out.push(big ? (kat ? [1, 4] : [2, 3]) : [kat ? (hand === 0 ? 4 : 1) : hand === 0 ? 3 : 2]);
  }
  return out;
}

// Self-check: `node src/scripts/taiko-autoplay.ts`
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('taiko-autoplay.ts')) {
  const beat = 500, d = (time: number): Note => ({ time, kat: false, big: false }), k = (time: number): Note => ({ time, kat: true, big: false });
  const h = noteHalves([d(0), d(125), k(250), k(375), d(2500), d(2625)], beat).map((x) => x.join(''));
  // hands alternate R,L,R,L,R,L straight through the 2.1s rest (under 4 beats), so the hand carries on
  console.assert(h.join(',') === '3,2,4,1,3,2', h.join(','));
  const after = noteHalves([d(0), d(2500)], beat).map((x) => x.join('')); // gap 2500 >= 4 beats: restarts right
  console.assert(after.join(',') === '3,3', after.join(','));
  console.log('ok', h.join(','), after.join(','));
}
