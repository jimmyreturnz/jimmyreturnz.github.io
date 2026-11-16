import rawStats from '../data/stats.json';
import type { Stats } from '../../scripts/fetch-stats';

export const stats = rawStats as unknown as Stats;
export const fmt = (n: number | null | undefined, d = 0) => (n == null ? null : n.toLocaleString('en-US', { maximumFractionDigits: d }));
export const rank = (n: number | null | undefined) => (n == null ? null : `#${n.toLocaleString('en-US')}`);
