"use client";

import Link from "next/link";
import { useRef } from "react";
import { StarIcon } from "@/components/site/Icons";
import { useGh } from "@/components/hub/useGh";
import { kfmt, isoAgo } from "@/lib/format";
import type { GhRepo, RepoRef } from "@/lib/github";
import { pulse } from "@/lib/pulse";

/** One repository card with live GitHub numbers. `area` is the label under the name (starter set) or the language. */
export function RepoCard({ repo, area, onRemove }: { repo: RepoRef; area?: string; onRemove?: () => void }) {
  const { data, error, loading } = useGh<GhRepo>({ op: "repo", owner: repo.owner, name: repo.name });
  const glow = useRef<HTMLSpanElement>(null);
  const move = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (glow.current) {
      glow.current.style.left = `${e.clientX - r.left}px`;
      glow.current.style.top = `${e.clientY - r.top}px`;
    }
  };
  const p = data ? pulse(data) : null;
  return (
    <div className="relative h-full" data-testid="repo-card">
      <Link href={`/repo/${repo.owner}/${repo.name}`} className="cm-card" onMouseMove={move}>
        <span className="cm-glow" ref={glow} aria-hidden="true" />
        <div className="cm-card-top">
          {data?.avatar ? <img className="cm-av" src={`${data.avatar}${data.avatar.includes("?") ? "&" : "?"}s=72`} alt="" width={36} height={36} loading="lazy" /> : <span className="cm-av" aria-hidden="true" />}
          <div className="min-w-0">
            <div className="cm-card-title">
              <span className="own">{repo.owner}/</span>
              {repo.name}
            </div>
            <div className="cm-card-cat">{area ?? (data?.language ? `${data.language} project` : "Repository")}</div>
          </div>
        </div>
        <p className="cm-card-desc">{error ? error : loading ? "Reading GitHub…" : data?.description || "No description on GitHub."}</p>
        <div className="cm-chips">
          {data?.archived ? <span className="cm-chip dim">Archived</span> : null}
          {data?.language ? <span className="cm-chip hot">{data.language}</span> : null}
          {data?.license && data.license !== "NOASSERTION" ? <span className="cm-chip">{data.license}</span> : null}
          {(data?.topics ?? []).slice(0, 3).map((t) => (
            <span key={t} className="cm-chip dim">
              #{t}
            </span>
          ))}
          {!data ? <span className="cm-chip dim">—</span> : null}
        </div>
        <div className="cm-card-foot">
          <span className="inline-flex items-center gap-1.5">
            <StarIcon size={12} /> <b>{data ? kfmt(data.stars) : "—"}</b> <span className="lime">pushed {data ? isoAgo(data.pushedAt) : "—"}</span>
          </span>
          <span className="whitespace-nowrap" title="Pulse: recent pushes plus reach, from public GitHub numbers">
            PULSE <b>{p ?? "—"}</b>
            <span className="cm-bar-meter" aria-hidden="true">
              <span style={{ width: `${p ?? 0}%` }} />
            </span>
          </span>
        </div>
      </Link>
      {onRemove ? (
        <button type="button" className="cm-copy absolute top-4 right-4 bg-[#0b0b0b]" onClick={onRemove} aria-label={`Remove ${repo.owner}/${repo.name} from your hub`} data-testid="hub-remove">
          Remove
        </button>
      ) : null}
    </div>
  );
}
