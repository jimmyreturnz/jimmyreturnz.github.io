// @ts-check
import { defineConfig } from 'astro/config';

// The repo-level assets/ folder (fonts, vectorheart kit, later audio and charts)
// is served as-is at the site root, so the design mockups and the site share one copy.
export default defineConfig({
  publicDir: '../assets',
  build: { format: 'directory' },
});
