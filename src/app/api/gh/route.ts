import { NextResponse } from "next/server";
import { allowPublic, tooMany } from "@/lib/guard";
import { getStore } from "@/lib/server/store";
import { ghRead } from "@/lib/server/github";
import type { GhOp } from "@/lib/github";

export const dynamic = "force-dynamic";

/*
 * Read-only window on public GitHub data: /api/gh?op=repo&owner=..&name=.. (see src/lib/github.ts for every op).
 * Per-network and site-wide request limits sit in front of the cache; a refused or quota-limited answer tells the
 * browser to read GitHub itself (status 503 with reason "limited").
 */

const OPS = new Set<GhOp>(["repo", "languages", "commits", "pulls", "reviews", "contributors", "tasks", "commit", "pull", "user", "userRepos"]);

export async function GET(request: Request) {
  const u = new URL(request.url);
  const op = u.searchParams.get("op") as GhOp | null;
  if (!op || !OPS.has(op)) return NextResponse.json({ error: "Unknown question." }, { status: 400 });
  if (!(await allowPublic(getStore(), request, "gh", 120, 2400))) return tooMany();
  const q = {
    op,
    owner: u.searchParams.get("owner") ?? undefined,
    name: u.searchParams.get("name") ?? undefined,
    ref: u.searchParams.get("ref") ?? undefined,
    login: u.searchParams.get("login") ?? undefined,
    label: u.searchParams.get("label") ?? undefined,
  };
  const a = await ghRead(q);
  if (a.ok) return NextResponse.json({ data: a.data, cachedAt: a.cachedAt, stale: Boolean(a.stale) }, { headers: { "cache-control": "public, max-age=60" } });
  return NextResponse.json({ error: a.reason, reset: a.reset ?? null }, { status: a.status, headers: { "cache-control": "no-store" } });
}
