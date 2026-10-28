"use client";

import { GH_API, ghPath, shape, type GhQuery } from "@/lib/github";

/*
 * Browser side of the GitHub reads. Asks the site's cached route first; when the site's quota is spent (or the route
 * is busy) it reads api.github.com directly with this visitor's own keyless quota. Answers are kept in memory for the
 * visit so switching tabs does not ask again.
 */

export class GhError extends Error {
  constructor(
    public reason: "not-found" | "limited" | "bad-request" | "down",
    public reset: number | null = null,
  ) {
    super(reason);
  }
}

const memo = new Map<string, { at: number; data: unknown }>();
const running = new Map<string, Promise<unknown>>();
const MEMO_MS = 5 * 60_000;

function qs(q: GhQuery) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== "") p.set(k, String(v));
  return p.toString();
}

async function direct(q: GhQuery): Promise<unknown> {
  const path = ghPath(q);
  if (!path) throw new GhError("bad-request");
  const res = await fetch(`${GH_API}${path}`, { headers: { accept: "application/vnd.github+json" } });
  if (res.status === 404 || res.status === 409 || res.status === 422) throw new GhError("not-found");
  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get("x-ratelimit-reset") ?? 0);
    throw new GhError("limited", reset > 0 ? reset : null);
  }
  if (!res.ok) throw new GhError("down");
  return shape(q.op, await res.json());
}

export async function ghGet<T>(q: GhQuery): Promise<T> {
  const key = qs(q);
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < MEMO_MS) return hit.data as T;
  const now = running.get(key);
  if (now) return now as Promise<T>;
  const job = (async () => {
    let fallback = false;
    try {
      const res = await fetch(`/api/gh?${key}`);
      if (res.ok) {
        const body = (await res.json()) as { data: unknown };
        return body.data;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string; reset?: number | null };
      if (res.status === 404) throw new GhError("not-found");
      if (res.status === 400) throw new GhError("bad-request");
      fallback = true;
      if (res.status !== 503 && res.status !== 429 && res.status !== 502) throw new GhError("down", body.reset ?? null);
    } catch (e) {
      if (e instanceof GhError && !fallback) throw e;
      fallback = true;
    }
    return direct(q);
  })()
    .then((data) => {
      memo.set(key, { at: Date.now(), data });
      return data;
    })
    .finally(() => running.delete(key));
  running.set(key, job);
  return job as Promise<T>;
}

/** Plain words for a failed read. */
export function ghWords(e: unknown): string {
  if (e instanceof GhError) {
    if (e.reason === "not-found") return "GitHub has no public repository or item at that address.";
    if (e.reason === "bad-request") return "That is not a valid GitHub path.";
    if (e.reason === "limited") {
      const when = e.reset ? new Date(e.reset * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
      return `GitHub's hourly limit for anonymous reads is used up${when ? ` until about ${when}` : " for now"}. Cached data stays visible; try again later.`;
    }
  }
  return "GitHub did not answer. Try again in a moment.";
}
