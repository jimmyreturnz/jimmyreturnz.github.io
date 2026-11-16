---
status: accepted (amended 2026-11-16 after design council review)
---

# Host on Cloudflare Pages, not GitHub Pages

Despite the repo being named `jimmyreturnz.github.io`, the site is deployed to Cloudflare Pages (built from this GitHub repo), on the free `*.pages.dev` address first and the custom domain `jimmyreturnz.dev` later. The site is media-heavy (songs, gameplay video) and needs a little server-side code (Guestbook, CMS login), which GitHub Pages cannot run. Cloudflare also gives always-on DDoS protection and custom security headers on the free plan.

## Open check before launch

Bandwidth on the free plan is generous, but Cloudflare's self-serve terms have restricted serving a disproportionate amount of audio/video through the CDN, and Pages has a per-file size limit. Before launch, read the current terms. If songs and the TETR.IO video are a problem, serve them from Cloudflare R2 (or Stream for video) and record that here.

## Considered Options

- **GitHub Pages**: free and zero-config, but static only, no custom headers, and a soft 100 GB/month bandwidth limit that audio and video eat into.
- **Vercel / Netlify**: capable, but free-tier bandwidth caps matter more for a media-heavy site.
