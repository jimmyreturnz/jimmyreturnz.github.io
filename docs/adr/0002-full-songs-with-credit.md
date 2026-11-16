---
status: accepted (amended 2026-11-16 after design council review)
---

# Ship full songs for the chart players, credited, loaded on demand

The osu!mania and osu!taiko players use the full songs rather than short clips, because the owner's own charts are the point of the Showcases. The site is a non-commercial personal portfolio: no ads, no sales, nothing sold on the pages that play music. Audio is fetched only when a visitor opens or plays a chart, and every player shows a credit line plus a "Play on osu!" link to the beatmapset. If an artist or rights holder objects, the track is removed or swapped for a short clip immediately.

## Permissions

- **かめりあ – Quaoar**: free to use as long as the use is not illegal; Camellia published the track with a download link himself: https://www.youtube.com/watch?v=yjQmZBvi3WE
- **Camellia – Circles of Death** (osu!taiko chart, beatmapset 2404655 / difficulty 5216517): the owner considers it covered by the same Camellia permission. That permission statement names Quaoar, so this is inferred; get written confirmation when possible. Both charts are the owner's own maps; credit reads "Music: <artist> – <title> · Mapped by jimmyreturnz".
- ~~DJ SHARPNEL – THE POWER OF UNDERGROUND~~: dropped; no written permission could be found.

## Takedown

Contact: `apiwatkon.rtz@gmail.com`, shown in the site footer. A pre-cut 30-second clip of each song is kept ready so a track can be downgraded the same day.

## Audio delivery

- Formats: AAC (`.m4a`, for iOS Safari) and Opus (`.webm`/`.ogg`, elsewhere), around 128 kbps; each song file under 5 MB.
- Stream the song through an `<audio>` element connected to the Web Audio graph; decode only the short hitsound files into memory.
- Schedule notes from the audio clock (`AudioContext.currentTime`, adjusted for output latency), never from `performance.now()`.
