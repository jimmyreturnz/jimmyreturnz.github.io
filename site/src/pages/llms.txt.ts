// /llms.txt: a plain-text summary for AI search tools, built from the same data as the pages.
import { profile, projects, timeline } from '../data/site';
import { pages } from '../data/pages';

export function GET({ site }: { site?: URL }) {
  const url = (p: string) => (site ? new URL(p, site).href : p);
  const text = [
    `# ${profile.fullName} (${profile.handle})`,
    '',
    `> ${profile.fullName}, also known as ${profile.nickname} and ${profile.handle}: ${profile.role} based in ${profile.location}. ${profile.study}.`,
    '',
    ...profile.bio,
    '',
    '## Projects',
    ...projects.map((p) => `- ${p.title}: ${p.summary}${p.outcome.value ? ` Result: ${p.outcome.value} ${p.outcome.text}.` : ''}${p.link ? ` ${p.link.href}` : ''}`),
    '',
    '## Timeline',
    ...timeline.map((t) => `- ${t.from} to ${t.to ?? 'present'}${t.expected ? ' (expected)' : ''}: ${t.what}, ${t.where}${t.blurb ? `. ${t.blurb}` : ''}`),
    '',
    '## Pages',
    `- [Lobby](${url('/')})`,
    ...pages.map((p) => `- [${p.label}](${url(p.href)})`),
    '',
    '## Contact',
    `- Email: ${profile.email}`,
    ...Object.entries(profile.links).filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`),
    '',
  ].join('\n');
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
