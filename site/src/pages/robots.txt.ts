// /robots.txt: everything may be crawled, AI crawlers included. Points at the sitemap once SITE_URL is set.
export function GET({ site }: { site?: URL }) {
  const lines = ['User-agent: *', 'Allow: /', ...(site ? [`Sitemap: ${new URL('/sitemap.xml', site).href}`] : []), ''];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
