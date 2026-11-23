// /sitemap.xml: the Lobby and the Portfolio pages in the nav. Needs SITE_URL (absolute URLs); empty without it.
import { pages } from '../data/pages';

export function GET({ site }: { site?: URL }) {
  const urls = site ? ['/', '/lobby/', ...pages.map((p) => p.href)].map((p) => `<url><loc>${new URL(p, site).href}</loc></url>`) : [];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
