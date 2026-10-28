"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useGhMany } from "@/components/hub/useGh";
import { useHub } from "@/components/hub/useHub";
import { ArrowRight } from "@/components/site/Icons";
import { MAX_REPOS } from "@/components/workspaces/Aggregate";
import type { GhContributor } from "@/lib/github";

type Person = { login: string; avatar: string; total: number; repos: { repo: string; n: number }[] };

/** Contributor Dashboard: contributors of the hub's repositories, merged by login and ranked by commits. */
export function ContributorBoard() {
  const { list } = useHub();
  const repos = list.slice(0, MAX_REPOS);
  const { rows, done } = useGhMany<GhContributor[]>(repos.map((r) => ({ op: "contributors", owner: r.owner, name: r.name })));
  const people = useMemo(() => {
    const m = new Map<string, Person>();
    for (const row of rows)
      for (const c of row.data ?? []) {
        if (c.login.endsWith("[bot]")) continue;
        const p = m.get(c.login) ?? { login: c.login, avatar: c.avatar, total: 0, repos: [] };
        p.total += c.contributions;
        p.repos.push({ repo: `${row.q.owner}/${row.q.name}`, n: c.contributions });
        m.set(c.login, p);
      }
    return [...m.values()].sort((a, b) => b.repos.length - a.repos.length || b.total - a.total).slice(0, 30);
  }, [rows]);
  return (
    <div>
      <div className="mb-4 flex flex-wrap justify-between gap-3 font-mono text-[12px] text-muted" data-testid="agg-status">
        <span>
          {done < repos.length ? `Reading GitHub ${done}/${repos.length} repos…` : `${people.length} people across ${repos.length} repos`}
          {list.length > MAX_REPOS ? ` · first ${MAX_REPOS} of ${list.length} in your hub` : ""}
        </span>
        <span>bots left out · first page of each repo&apos;s list</span>
      </div>
      {people.length ? (
        <div className="cm-grid" data-testid="people">
          {people.map((p) => (
            <Link key={p.login} href={`/contributor/${p.login}`} className="cm-card" style={{ padding: 22 }}>
              <div className="cm-card-top" style={{ gap: 14 }}>
                {p.avatar ? <img className="cm-av round" style={{ width: 56, height: 56 }} src={`${p.avatar}${p.avatar.includes("?") ? "&" : "?"}s=112`} alt="" width={56} height={56} loading="lazy" /> : <span className="cm-av round" style={{ width: 56, height: 56 }} />}
                <div className="min-w-0">
                  <div className="cm-name truncate">{p.login}</div>
                  <div className="cm-card-cat">github.com/{p.login}</div>
                </div>
              </div>
              <div className="cm-chips">
                {p.repos.slice(0, 3).map((r) => (
                  <span key={r.repo} className="cm-chip">
                    {r.repo.split("/")[1]}
                  </span>
                ))}
              </div>
              <div className="cm-card-foot">
                <span>
                  {p.repos.length} repo{p.repos.length > 1 ? "s" : ""} · {p.total.toLocaleString("en-US")} commits
                </span>
                <span className="lime inline-flex items-center gap-1.5">
                  Profile <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="cm-panel cm-empty">{repos.length ? "Reading contributors…" : "Your hub is empty. Add repositories first."}</div>
      )}
    </div>
  );
}
