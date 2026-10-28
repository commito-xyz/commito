"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useGh, useGhMany } from "@/components/hub/useGh";
import { useHub } from "@/components/hub/useHub";
import { ArrowUpRight } from "@/components/site/Icons";
import { MAX_REPOS } from "@/components/workspaces/Aggregate";
import { kfmt, isoAgo } from "@/lib/format";
import type { GhContributor, GhUser, GhUserRepo } from "@/lib/github";

export function Profile({ login }: { login: string }) {
  const user = useGh<GhUser>({ op: "user", login });
  const repos = useGh<GhUserRepo[]>({ op: "userRepos", login });
  const { list } = useHub();
  const hub = list.slice(0, MAX_REPOS);
  const { rows } = useGhMany<GhContributor[]>(hub.map((r) => ({ op: "contributors", owner: r.owner, name: r.name })));
  const inHub = useMemo(
    () =>
      rows
        .map((row) => ({ repo: `${row.q.owner}/${row.q.name}`, n: (row.data ?? []).find((c) => c.login.toLowerCase() === login.toLowerCase())?.contributions ?? 0 }))
        .filter((x) => x.n > 0),
    [rows, login],
  );
  const u = user.data;
  const own = (repos.data ?? []).filter((r) => !r.fork);
  const stars = own.reduce((a, r) => a + r.stars, 0);
  return (
    <div data-testid="profile">
      <div className="cm-center-head pb-8">
        <div className="cm-crumbs justify-center">
          <Link href="/contributors">← Contributors</Link>
        </div>
        {u?.avatar ? <img className="cm-person" src={`${u.avatar}${u.avatar.includes("?") ? "&" : "?"}s=224`} alt="" width={112} height={112} /> : <span className="cm-person bg-[#111]" />}
        <h1 className="cm-title">
          {u?.name || login}
          <span className="cm-cursor">_</span>
        </h1>
        <p className="cm-lead mx-auto">{user.error ? user.error : u ? u.bio || `${u.type === "Organization" ? "Organization" : "Developer"} on GitHub since ${u.created.slice(0, 4)}.` : "Reading GitHub…"}</p>
        <div className="cm-links">
          <a className="cm-chip" href={u?.url || `https://github.com/${login}`} target="_blank" rel="noreferrer">
            github.com/{login} ↗
          </a>
          {u?.blog ? (
            <a className="cm-chip" href={u.blog} target="_blank" rel="noreferrer nofollow">
              {u.blog.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 40)}
            </a>
          ) : null}
        </div>
      </div>
      <div className="cm-stats mt-0">
        {[
          { k: "Public repos", v: u ? String(u.publicRepos) : "—" },
          { k: "Followers", v: u ? kfmt(u.followers) : "—" },
          { k: "Stars on recent repos", v: repos.data ? kfmt(stars) : "—" },
          { k: "Repos in your hub", v: rows.length ? String(inHub.length) : "—" },
        ].map((s) => (
          <div key={s.k} className="cm-stat">
            <span className="cm-stat-k">{s.k}</span>
            <span className="cm-stat-v">{s.v}</span>
          </div>
        ))}
      </div>
      {inHub.length ? (
        <div className="cm-panel mt-4">
          <h3>Contributions in your hub</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {inHub.map((x) => (
              <Link key={x.repo} href={`/repo/${x.repo}`} className="cm-chip">
                {x.repo} · {x.n.toLocaleString("en-US")} commits
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-14">
        <p className="cm-eyebrow">Their repos</p>
        <h2 className="cm-h2" style={{ maxWidth: "none", fontSize: "clamp(26px,4vw,44px)" }}>
          <span className="text-muted">github.com/</span>
          {login}
        </h2>
        <p className="cm-help">Most recently pushed repositories they own, forks left out.</p>
        <div className="cm-grid mt-6">
          {own.length ? (
            own.map((r) => (
              <Link key={r.fullName} href={`/repo/${r.fullName}`} className="cm-card">
                <div className="cm-card-title">
                  <span className="own">{r.fullName.split("/")[0]}/</span>
                  {r.fullName.split("/")[1]}
                </div>
                <p className="cm-card-desc">{r.description || "No description on GitHub."}</p>
                <div className="cm-card-foot">
                  <span>
                    ★ <b>{kfmt(r.stars)}</b> {r.language ? `· ${r.language}` : ""}
                  </span>
                  <span>pushed {isoAgo(r.pushedAt)}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="cm-panel cm-empty">{repos.error ?? (repos.loading ? "Reading GitHub…" : "No public repositories of their own.")}</div>
          )}
        </div>
        <a href={`https://github.com/${login}?tab=repositories`} target="_blank" rel="noreferrer" className="cm-btn sm mt-6">
          All their repositories <ArrowUpRight size={13} />
        </a>
      </div>
    </div>
  );
}
