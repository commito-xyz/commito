import "server-only";
import { GH_API, ghPath, ghTtl, shape, type GhQuery } from "@/lib/github";

/*
 * Server reads from the public GitHub REST API. Keyless by default (60 requests per hour per server address);
 * with the optional GITHUB_TOKEN env (a fine-grained token with no scopes, public data only) GitHub allows 5,000.
 * Answers are cached per question (5 to 60 minutes), one upstream request per question at a time, and once GitHub
 * says the hourly quota is spent the server stops asking until the reset time and says so calmly, so the browser can
 * read GitHub directly with the visitor's own quota instead.
 */

export type GhAnswer =
  | { ok: true; data: unknown; cachedAt: number; stale?: boolean }
  | { ok: false; status: number; reason: "not-found" | "limited" | "bad-request" | "down"; reset?: number };

const MAX_ENTRIES = 600;
const cache = new Map<string, { at: number; ttl: number; data: unknown }>();
const inflight = new Map<string, Promise<GhAnswer>>();
/** Unix seconds until which GitHub said this server's quota is spent. */
let limitedUntil = 0;

function remember(key: string, ttl: number, data: unknown) {
  if (cache.size >= MAX_ENTRIES) {
    // Oldest insertion goes first (Map keeps insertion order).
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.delete(key);
  cache.set(key, { at: Date.now(), ttl, data });
}

export const ghLimitedUntil = () => limitedUntil;

export async function ghRead(q: GhQuery): Promise<GhAnswer> {
  const path = ghPath(q);
  if (!path) return { ok: false, status: 400, reason: "bad-request" };
  const key = path.toLowerCase();
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && now - hit.at < hit.ttl * 1000) return hit.data === null ? { ok: false, status: 404, reason: "not-found" } : { ok: true, data: hit.data, cachedAt: hit.at };
  if (limitedUntil * 1000 > now) {
    // Quota spent: an older answer is still better than none.
    if (hit && hit.data !== null) return { ok: true, data: hit.data, cachedAt: hit.at, stale: true };
    return { ok: false, status: 503, reason: "limited", reset: limitedUntil };
  }
  const running = inflight.get(key);
  if (running) return running;
  const job = fetchUpstream(q, path, key).finally(() => inflight.delete(key));
  inflight.set(key, job);
  return job;
}

async function fetchUpstream(q: GhQuery, path: string, key: string): Promise<GhAnswer> {
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "commito-site",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.authorization = `Bearer ${token}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${GH_API}${path}`, { headers, cache: "no-store", signal: ctrl.signal });
    const remaining = res.headers.get("x-ratelimit-remaining");
    const reset = Number(res.headers.get("x-ratelimit-reset") ?? 0);
    if ((res.status === 403 || res.status === 429) && (remaining === "0" || res.headers.get("retry-after"))) {
      const retry = Number(res.headers.get("retry-after") ?? 0);
      limitedUntil = reset > 0 ? reset : Math.floor(Date.now() / 1000) + (retry > 0 ? retry : 600);
      const old = cache.get(key);
      if (old && old.data !== null) return { ok: true, data: old.data, cachedAt: old.at, stale: true };
      return { ok: false, status: 503, reason: "limited", reset: limitedUntil };
    }
    if (res.status === 404 || res.status === 451 || res.status === 422 || res.status === 409) {
      // 409: empty repository (commits); 422: unknown commit. Both mean "nothing to show".
      remember(key, 300, null);
      return { ok: false, status: 404, reason: "not-found" };
    }
    if (!res.ok) return { ok: false, status: 502, reason: "down" };
    if (remaining === "0" && reset > 0) limitedUntil = reset;
    const data = shape(q.op, await res.json());
    remember(key, ghTtl(q.op), data);
    return { ok: true, data, cachedAt: Date.now() };
  } catch {
    return { ok: false, status: 502, reason: "down" };
  } finally {
    clearTimeout(timer);
  }
}
