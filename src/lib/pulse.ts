/*
 * Pulse: a 0-99 activity indicator for a repository, computed only from public GitHub numbers so anyone can
 * recompute it. Half from how recently the default branch was pushed (halves every 30 days), half from the share
 * of attention it gets (log of stars + forks, capped). It is a reading aid, not a quality rating.
 */
export function pulse(r: { pushedAt: string; stars: number; forks: number; archived?: boolean }, now = Date.now()) {
  if (r.archived) return 0;
  const t = Date.parse(r.pushedAt);
  const days = Number.isFinite(t) ? Math.max(0, (now - t) / 86_400_000) : 365;
  const recency = 50 * Math.pow(0.5, days / 30);
  const reach = Math.min(49, (49 * Math.log10(1 + Math.max(0, r.stars) + Math.max(0, r.forks))) / 5.5);
  return Math.max(0, Math.min(99, Math.round(recency + reach)));
}
