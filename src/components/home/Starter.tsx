"use client";

import Link from "next/link";
import { RepoCard } from "@/components/hub/RepoCard";
import { useGhMany } from "@/components/hub/useGh";
import { SEED_REPOS } from "@/content/seed";
import type { GhContributor } from "@/lib/github";
import { ArrowRight } from "@/components/site/Icons";

/** Six repositories of the starter hub with live GitHub numbers. */
export function StarterGrid() {
  return (
    <div className="cm-grid">
      {SEED_REPOS.slice(0, 6).map((r) => (
        <RepoCard key={`${r.owner}/${r.name}`} repo={r} area={r.area} />
      ))}
    </div>
  );
}

const PICKS = SEED_REPOS.slice(0, 3);

/** The most active contributor of three starter repositories, read live from GitHub. */
export function ContributorPreview() {
  const { rows } = useGhMany<GhContributor[]>(PICKS.map((r) => ({ op: "contributors", owner: r.owner, name: r.name })));
  return (
    <div className="cm-grid3">
      {PICKS.map((repo, i) => {
        const row = rows[i];
        const people = (row?.data ?? []).filter((c) => !c.login.endsWith("[bot]"));
        const top = people[0];
        return (
          <div key={repo.name} className="cm-card" data-testid="contrib-card">
            <div className="cm-card-top">
              {top?.avatar ? <img className="cm-av round" style={{ width: 56, height: 56 }} src={`${top.avatar}${top.avatar.includes("?") ? "&" : "?"}s=112`} alt="" width={56} height={56} loading="lazy" /> : <span className="cm-av round" style={{ width: 56, height: 56 }} aria-hidden="true" />}
              <div className="min-w-0">
                <div className="cm-name truncate">{top ? top.login : row?.error ? "Not available" : "Reading…"}</div>
                <div className="cm-card-cat truncate">
                  top contributor · {repo.owner}/{repo.name}
                </div>
              </div>
            </div>
            <p className="cm-blurb">
              {top
                ? `${top.contributions.toLocaleString("en-US")} commits to ${repo.name} on the default branch, by GitHub's own count. ${people.length > 1 ? `${people.length - 1} more people appear in the first page of contributors.` : ""}`
                : row?.error ?? "Loading the contributor list from GitHub."}
            </p>
            <div className="cm-chips">
              {people.slice(1, 4).map((p) => (
                <span key={p.login} className="cm-chip">
                  {p.login}
                </span>
              ))}
            </div>
            <div className="cm-card-foot">
              <span>{people.length ? `${people.length} listed · ${people.reduce((a, p) => a + p.contributions, 0).toLocaleString("en-US")} commits` : "—"}</span>
              {top ? (
                <Link href={`/contributor/${top.login}`} className="lime inline-flex items-center gap-1.5">
                  Profile <ArrowRight size={12} />
                </Link>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
