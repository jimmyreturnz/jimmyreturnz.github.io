// Build-time checks for files the owner adds later (songs, charts), so players switch on by themselves.
// Builds run from site/, and the repo-level assets/ folder is the public dir.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ASSETS = resolve(process.cwd(), '../assets');
export const hasAsset = (path: string) => existsSync(resolve(ASSETS, path));

/** Audio sources that exist for a base name, in preference order (AAC for Safari/iOS, Opus, then MP3). */
export function audioSources(base: string) {
  return [
    { file: `audio/${base}.m4a`, type: 'audio/mp4' },
    { file: `audio/${base}.opus`, type: 'audio/ogg; codecs=opus' },
    { file: `audio/${base}.mp3`, type: 'audio/mpeg' },
  ].filter((s) => hasAsset(s.file)).map((s) => ({ src: `/${s.file}`, type: s.type }));
}
