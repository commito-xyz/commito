"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useGh } from "@/components/hub/useGh";
import { useHub } from "@/components/hub/useHub";
import { usePractice } from "@/components/records/usePractice";
import { ArrowRight, ArrowUpRight } from "@/components/site/Icons";
import { CommitRows, ContributorRows, PullRows, Skeleton, TaskRows } from "@/components/repo/Lists";
import { bookLive } from "@/config/contracts";
import { kfmt, isoAgo } from "@/lib/format";
import { repoKey, type GhCommit, type GhContributor, type GhPull, type GhRepo, type GhTask } from "@/lib/github";
import { recordsForRepo } from "@/lib/book";
import { repoHash, type ChainRecord } from "@/lib/records";
import { pulse } from "@/lib/pulse";

type Tab = "commits" | "pulls" | "contributors" | "tasks" | "languages";

const LANG_COLORS = ["#d9f970", "#9fd3ff", "#c8a6ff", "#ffb86b", "#6be863", "#ff6b5e", "#8a8a8a"];

function RecordsPanel({ owner, name }: { owner: string; name: string }) {
  const key = repoKey({ owner, name });
  const practice = usePractice();
  const mine = practice.list.filter((r) => r.repo === key);
  const [chain, setChain] = useState<{ rows: ChainRecord[] | null; error: string | null }>({ rows: null, error: null });
  useEffect(() => {
    if (!bookLive()) return;
    let live = true;
    recordsForRepo(repoHash(key))
      .then((rows) => live && setChain({ rows, error: null }))
      .catch(() => live && setChain({ rows: null, error: "The record book could not be read right now." }));
    return () => {
      live = false;
    };
  }, [key]);
  const reviewed = chain.rows?.filter((r) => r.reviewCount > 0).length ?? 0;
  return (
    <div className="cm-panel hot mt-4" data-testid="repo-records">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3>Contribution records</h3>
          <p className="cm-help mt-2">
            {bookLive()
              ? chain.rows
                ? `${chain.rows.length} record${chain.rows.length === 1 ? "" : "s"} on Robinhood Chain point at ${key}; ${reviewed} co-signed by a second wallet.`
                : chain.error ?? "Reading the record book…"
              : `The record book is not deployed yet, so records run in practice mode: signed by your wallet, kept in this browser. ${mine.length ? `You hold ${mine.length} practice record${mine.length === 1 ? "" : "s"} for this repository.` : ""}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/records?repo=${encodeURIComponent(key)}`} className="cm-btn sm">
            See records
          </Link>
          <Link href={`/record?repo=${encodeURIComponent(key)}`} className="cm-btn sm lime">
            Record work here <ArrowRight size={13} className="go" />
          </Link>
        </div>
      </div>
      {chain.rows?.length ? (
        <div className="mt-4 border-t border-dashed border-[#ffffff24] pt-4 font-mono text-[12px] text-muted">
          {chain.rows.slice(0, 5).map((r) => (
            <div key={r.id} className="flex flex-wrap justify-between gap-2 py-1">
              <span className="truncate">
                #{r.id} · {r.kind === 1 ? `commit ${r.ref.slice(0, 7)}` : `PR #${r.ref}`} · {r.author.slice(0, 6)}…{r.author.slice(-4)}
              </span>
              <span>{r.reviewCount ? <span className="lime">{r.reviewCount} review</span> : "not reviewed"}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function RepoView({ owner, name }: { owner: string; name: string }) {
  const hub = useHub();
  const ref = { owner, name };
  const repo = useGh<GhRepo>({ op: "repo", owner, name });
  const [tab, setTab] = useState<Tab>("commits");
  const commits = useGh<GhCommit[]>(tab === "commits" ? { op: "commits", owner, name } : null);
  const pulls = useGh<GhPull[]>(tab === "pulls" ? { op: "pulls", owner, name } : null);
  const people = useGh<GhContributor[]>(tab === "contributors" ? { op: "contributors", owner, name } : null);
  const good = useGh<GhTask[]>(tab === "tasks" ? { op: "tasks", owner, name, label: "good first issue" } : null);
  const help = useGh<GhTask[]>(tab === "tasks" ? { op: "tasks", owner, name, label: "help wanted" } : null);
  const langs = useGh<Record<string, number>>(tab === "languages" ? { op: "languages", owner, name } : null);
  const d = repo.data;
  const inHub = hub.has(ref);

  const tasks = [...(good.data ?? []), ...(help.data ?? [])].filter((t, i, all) => all.findIndex((x) => x.number === t.number) === i);
  const langTotal = Object.values(langs.data ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div data-testid="repo-view">
      <div className="cm-page-head">
        <div className="cm-crumbs">
          <Link href="/explore">← Repository Hub</Link>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-5">
          {d?.avatar ? <img className="cm-av" style={{ width: 64, height: 64, borderRadius: 14 }} src={`${d.avatar}${d.avatar.includes("?") ? "&" : "?"}s=128`} alt="" width={64} height={64} /> : <span className="cm-av" style={{ width: 64, height: 64, borderRadius: 14 }} />}
          <div className="min-w-0">
            <p className="cm-eyebrow">{d?.language ? `${d.language} project` : "Repository"}</p>
            <h1 className="cm-title mt-1">
              <span className="own">{owner}/</span>
              {name}
            </h1>
          </div>
        </div>
        <p className="cm-lead">{repo.error ? repo.error : d ? d.description || "No description on GitHub." : "Reading GitHub…"}</p>
        <div className="cm-chips mt-4">
          {d?.archived ? <span className="cm-chip dim">Archived</span> : null}
          {d?.license && d.license !== "NOASSERTION" ? <span className="cm-chip">{d.license}</span> : null}
          {(d?.topics ?? []).map((t) => (
            <span key={t} className="cm-chip dim">
              #{t}
            </span>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href={d?.url || `https://github.com/${owner}/${name}`} target="_blank" rel="noreferrer" className="cm-btn lime">
            View on GitHub <ArrowUpRight size={15} />
          </a>
          {d?.homepage ? (
            <a href={d.homepage} target="_blank" rel="noreferrer nofollow" className="cm-btn">
              {d.homepage.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 32)}
            </a>
          ) : null}
          <button type="button" className="cm-btn" onClick={() => (inHub ? hub.remove(ref) : hub.add(ref))} data-testid="hub-toggle">
            {inHub ? "Remove from hub" : "Add to hub"}
          </button>
        </div>
      </div>

      <div className="cm-stats mt-0">
        {[
          { k: "Pulse", v: d ? String(pulse(d)) : "—" },
          { k: "Stars", v: d ? kfmt(d.stars) : "—" },
          { k: "Forks", v: d ? kfmt(d.forks) : "—" },
          { k: "Last push", v: d ? isoAgo(d.pushedAt) : "—" },
        ].map((s) => (
          <div key={s.k} className="cm-stat">
            <span className="cm-stat-k">{s.k}</span>
            <span className="cm-stat-v">{s.v}</span>
            <span className="cm-stat-s">{s.k === "Stars" && d ? `${kfmt(d.openIssues)} open issues and PRs` : s.k === "Forks" && d ? `${kfmt(d.watchers)} watching` : s.k === "Pulse" ? "recency + reach, 0–99" : "default branch"}</span>
          </div>
        ))}
      </div>

      <RecordsPanel owner={owner} name={name} />

      <div className="cm-panel mt-4 p-0 overflow-hidden">
        <div className="cm-tabs" role="tablist">
          {(
            [
              ["commits", "Commits"],
              ["pulls", "Pull requests"],
              ["contributors", "Contributors"],
              ["tasks", "Open tasks"],
              ["languages", "Languages"],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={`cm-tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)} data-testid={`tab-${t}`}>
              {label}
            </button>
          ))}
          <a href={`https://github.com/${owner}/${name}`} target="_blank" rel="noreferrer" className="ml-auto hidden pr-2 text-[12px] text-muted sm:inline">
            github.com/{owner}/{name} ↗
          </a>
        </div>
        {tab === "commits" ? (commits.loading ? <Skeleton /> : commits.error ? <p className="cm-empty">{commits.error}</p> : <CommitRowsWithRecord items={commits.data ?? []} repo={`${owner}/${name}`} />) : null}
        {tab === "pulls" ? (pulls.loading ? <Skeleton /> : pulls.error ? <p className="cm-empty">{pulls.error}</p> : <PullRows items={pulls.data ?? []} owner={owner} name={name} />) : null}
        {tab === "contributors" ? (people.loading ? <Skeleton /> : people.error ? <p className="cm-empty">{people.error}</p> : <ContributorRows items={people.data ?? []} />) : null}
        {tab === "tasks" ? (good.loading || help.loading ? <Skeleton /> : good.error && help.error ? <p className="cm-empty">{good.error}</p> : <TaskRows items={tasks} />) : null}
        {tab === "languages" ? (
          langs.loading ? (
            <Skeleton rows={2} />
          ) : langs.error ? (
            <p className="cm-empty">{langs.error}</p>
          ) : (
            <div className="p-5" data-testid="languages">
              <div className="cm-langbar">
                {Object.entries(langs.data ?? {}).map(([l, n], i) => (
                  <span key={l} style={{ width: `${(n / Math.max(1, langTotal)) * 100}%`, background: LANG_COLORS[i % LANG_COLORS.length] }} />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] text-muted">
                {Object.entries(langs.data ?? {}).map(([l, n], i) => (
                  <span key={l} className="inline-flex items-center gap-2">
                    <i className="inline-block h-2 w-2 rounded-full" style={{ background: LANG_COLORS[i % LANG_COLORS.length] }} />
                    {l} {((n / Math.max(1, langTotal)) * 100).toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

function CommitRowsWithRecord({ items, repo }: { items: GhCommit[]; repo: string }) {
  return (
    <>
      <CommitRows items={items} />
      {items.length ? (
        <p className="cm-help px-4 pb-4">
          Worked on one of these? Copy its SHA into{" "}
          <Link className="lime" href={`/record?repo=${encodeURIComponent(repo.toLowerCase())}&kind=commit&ref=${items[0].sha}`}>
            Record work
          </Link>{" "}
          (prefilled with the newest commit).
        </p>
      ) : null}
    </>
  );
}
