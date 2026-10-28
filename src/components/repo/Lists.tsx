"use client";

import Link from "next/link";
import { useState } from "react";
import { useGh } from "@/components/hub/useGh";
import { isoAgo } from "@/lib/format";
import { reviewSummary, type GhCommit, type GhContributor, type GhPull, type GhReview, type GhTask } from "@/lib/github";

/* Row lists shared by the repository page and the workspaces. Every row links out to GitHub for the real thing. */

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="p-4" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="cm-skel" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

const av = (u: string, s = 56) => (u ? `${u}${u.includes("?") ? "&" : "?"}s=${s}` : "");

export function CommitRows({ items, repo }: { items: GhCommit[]; repo?: string }) {
  if (!items.length) return <p className="cm-empty">No commits to show.</p>;
  return (
    <div className="cm-rows" data-testid="commit-rows">
      {items.map((c) => (
        <a key={c.sha} href={c.url || undefined} target="_blank" rel="noreferrer" className="cm-row">
          {c.avatar ? <img src={av(c.avatar)} alt="" width={28} height={28} loading="lazy" /> : <span className="cm-av round" style={{ width: 28, height: 28 }} />}
          <span className="min-w-0">
            <span className="t block">{c.message || "(no message)"}</span>
            <span className="m">
              {repo ? `${repo} · ` : ""}
              {c.login || c.author || "unknown"} · {isoAgo(c.date)}
            </span>
          </span>
          <span className="r">
            {c.verified ? <span className="cm-tag live">signed</span> : null}
            <code>{c.sha.slice(0, 7)}</code>
          </span>
        </a>
      ))}
    </div>
  );
}

function ReviewTrail({ owner, name, number }: { owner: string; name: string; number: number }) {
  const { data, error, loading } = useGh<GhReview[]>({ op: "reviews", owner, name, ref: String(number) });
  if (loading) return <span className="m">reading reviews…</span>;
  if (error || !data) return <span className="m">{error}</span>;
  const s = reviewSummary(data);
  return (
    <span className="m" data-testid="review-trail">
      {s.reviewers ? `${s.approved} approved · ${s.changes} asked for changes · ${s.commented} comments` : "no reviews submitted yet"}
      {data.length ? ` · ${[...new Set(data.map((r) => r.login))].slice(0, 4).join(", ")}` : ""}
    </span>
  );
}

export function PullRows({ items, owner, name, repoLabel }: { items: (GhPull & { owner?: string; name?: string })[]; owner?: string; name?: string; repoLabel?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!items.length) return <p className="cm-empty">No pull requests to show.</p>;
  return (
    <div className="cm-rows" data-testid="pull-rows">
      {items.map((p) => {
        const o = p.owner ?? owner ?? "";
        const n = p.name ?? name ?? "";
        const key = `${o}/${n}#${p.number}`;
        return (
          <div key={key} className="cm-row">
            {p.avatar ? <img src={av(p.avatar)} alt="" width={28} height={28} loading="lazy" /> : <span className="cm-av round" style={{ width: 28, height: 28 }} />}
            <span className="min-w-0">
              <a href={p.url || undefined} target="_blank" rel="noreferrer" className="t block hover:underline">
                {p.title}
              </a>
              <span className="m">
                {repoLabel ? `${o}/${n} · ` : ""}#{p.number} by {p.login || "unknown"} · updated {isoAgo(p.updated)}
                {p.reviewers ? ` · ${p.reviewers} reviewer${p.reviewers > 1 ? "s" : ""} requested` : ""}
              </span>
              {open === key ? <ReviewTrail owner={o} name={n} number={p.number} /> : null}
            </span>
            <span className="r">
              {p.draft ? <span className="cm-tag">draft</span> : null}
              <span className={`cm-tag ${p.state}`}>{p.state}</span>
              <button type="button" className="cm-copy" onClick={() => setOpen(open === key ? null : key)} aria-expanded={open === key}>
                Reviews
              </button>
              <Link href={`/record?repo=${encodeURIComponent(`${o}/${n}`)}&kind=pr&ref=${p.number}`} className="cm-copy">
                Record
              </Link>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ContributorRows({ items }: { items: GhContributor[] }) {
  if (!items.length) return <p className="cm-empty">No contributors listed.</p>;
  const max = Math.max(...items.map((c) => c.contributions), 1);
  return (
    <div className="cm-rows" data-testid="contributor-rows">
      {items.map((c) => (
        <Link key={c.login} href={`/contributor/${c.login}`} className="cm-row">
          {c.avatar ? <img src={av(c.avatar)} alt="" width={28} height={28} loading="lazy" /> : <span className="cm-av round" style={{ width: 28, height: 28 }} />}
          <span className="min-w-0">
            <span className="t block">{c.login}</span>
            <span className="cm-bar-meter m-0 mt-1.5 block" style={{ width: "min(240px, 100%)" }}>
              <span style={{ width: `${(c.contributions / max) * 100}%` }} />
            </span>
          </span>
          <span className="r">{c.contributions.toLocaleString("en-US")} commits</span>
        </Link>
      ))}
    </div>
  );
}

export function TaskRows({ items, repoLabel }: { items: (GhTask & { repo?: string })[]; repoLabel?: boolean }) {
  if (!items.length) return <p className="cm-empty">No open issues with those labels right now.</p>;
  return (
    <div className="cm-rows" data-testid="task-rows">
      {items.map((t) => (
        <a key={`${t.repo ?? ""}#${t.number}`} href={t.url || undefined} target="_blank" rel="noreferrer" className="cm-row">
          <span className="cm-glyph" style={{ width: 28, height: 28, borderRadius: 7 }} aria-hidden="true">
            #
          </span>
          <span className="min-w-0">
            <span className="t block">{t.title}</span>
            <span className="m">
              {repoLabel && t.repo ? `${t.repo} · ` : ""}#{t.number} opened {isoAgo(t.created)} by {t.login || "unknown"} · {t.comments} comments
            </span>
          </span>
          <span className="r">
            {t.labels.slice(0, 2).map((l) => (
              <span key={l} className="cm-tag">
                {l}
              </span>
            ))}
          </span>
        </a>
      ))}
    </div>
  );
}
