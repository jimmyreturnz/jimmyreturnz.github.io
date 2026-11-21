---
status: accepted (amended 2026-11-16 after design council review)
---

# Ship full songs for the chart players, credited, loaded on demand

The osu!mania and osu!taiko players use the full songs rather than short clips, because the owner's own charts are the point of the Showcases. The site is a non-commercial personal portfolio: no ads, no sales, nothing sold on the pages that play music. Audio is fetched only when a visitor opens or plays a chart, and every player shows a credit line plus a "Play on osu!" link to the beatmapset. If an artist or rights holder objects, the track is removed or swapped for a short clip immediately.

## Permissions

- **かめりあ – Quaoar** (osu!mania 4K, beatmapset 1203155 / difficulty 2857557 "[4K] To the star"; the set also has [4K] Insane and [18K] komi im sorry): free to use as long as the use is not illegal; Camellia published the track with an official download link: https://www.youtube.com/watch?v=yjQmZBvi3WE
- **Camellia – Circles of Death** (osu!taiko chart, beatmapset 2404655 / difficulty 5216517 "Planet of Death"): the owner considers it covered by the same Camellia permission. That permission statement names Quaoar, so this is inferred; get written confirmation when possible. Both charts are the owner's own maps; credit reads "Music: <artist> – <title> · Mapped by jimmyreturnz".
- **Camellia – // Under Construction //** (osu!mania 7K, beatmapset 1122675 / difficulty 2346118 "[7K] incompleteness"): from the album *Blackmagik Blazing* (CTCD-019, Aug 2019), a first-party CTCD release. Camellia's Official Song Use Guidelines (https://cametek.jp/songuse_en.html, last updated 11 Nov 2020) allow free, non-commercial custom rhythm-game charts without asking and request credit; charts may never be sold. **Chart by LostCool, used with LostCool's permission** (owner keeps a screenshot of that permission). Credit reads "Music: Camellia – // Under Construction // (Blackmagik Blazing) · Chart: [7K] incompleteness by LostCool, used with permission".
- Hosting a playable chart with its audio on a personal site isn't explicitly listed in the guidelines (they route unlisted uses to "Other uses → contact cametek@gmail.com"). We follow the custom-chart rule's spirit: free, no ads or sales on these pages, no audio download link, credit + link to Camellia's site on every player and in the footer. Recommended: a short heads-up email to Camellia.
- **BGM: ZUN – Pure Furies ~ Whereabouts of the Heart** (Touhou 15), piano arrangement by **Nnwt** (https://www.youtube.com/watch?v=dSnTgNsFi1I). Nnwt's video description offers the MP3/MIDI/PDF as a download and says to feel free to change it; the file here is that download, re-encoded to AAC 128k. Touhou Project is by ZUN / Team Shanghai Alice (fan-work guidelines: non-commercial, credit, unofficial). Header title format: original artist - song title; the arranger is credited in the footer. Other YouTube covers are not ripped: each needs its own permission.
- ~~DJ SHARPNEL – THE POWER OF UNDERGROUND~~: dropped; no written permission could be found.

## Takedown

Contact: `apiwatkon.rtz@gmail.com`, shown in the site footer. A pre-cut 30-second clip of each song is kept ready so a track can be downgraded the same day.

## Audio delivery

- Formats: AAC (`.m4a`, for iOS Safari) and Opus (`.webm`/`.ogg`, elsewhere), around 128 kbps; each song file under 5 MB.
- Stream the song through an `<audio>` element connected to the Web Audio graph; decode only the short hitsound files into memory.
- Schedule notes from the audio clock (`AudioContext.currentTime`, adjusted for output latency), never from `performance.now()`.
