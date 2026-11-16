# Host on Cloudflare Pages, not GitHub Pages

Despite the repo being named `jimmyreturnz.github.io`, the site is deployed to Cloudflare Pages (built from this GitHub repo), with the custom domain `jimmyreturnz.dev` to be added later. The site is media-heavy (songs, gameplay video) and needs a little server-side code (Guestbook, CMS login, Stats Cards), which GitHub Pages cannot run. Cloudflare also gives unmetered bandwidth, always-on DDoS protection, and custom security headers on the free plan.

## Considered Options

- **GitHub Pages**: free and zero-config, but static only, no custom headers, and a soft 100 GB/month bandwidth limit that audio and video eat into.
- **Vercel / Netlify**: capable, but free-tier bandwidth caps matter more for a media-heavy site.
