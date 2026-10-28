"use client";

import { useMemo, useState } from "react";
import { RepoCard } from "@/components/hub/RepoCard";
import { useGhMany } from "@/components/hub/useGh";
import { MAX_HUB, useHub } from "@/components/hub/useHub";
import { SearchIcon } from "@/components/site/Icons";
import { SEED_REPOS } from "@/content/seed";
import { parseRepo, repoKey, type GhRepo } from "@/lib/github";
import { pulse } from "@/lib/pulse";
import { ghGet, ghWords } from "@/lib/gh-client";

type Sort = "pulse" | "stars" | "forks" | "pushed" | "issues" | "added";

export function HubExplorer() {
  const hub = useHub();
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("All");
  const [sort, setSort] = useState<Sort>("pulse");
  const [adding, setAdding] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const { rows, done } = useGhMany<GhRepo>(hub.list.map((r) => ({ op: "repo", owner: r.owner, name: r.name })));
  const byKey = useMemo(() => {
    const m = new Map<string, GhRepo>();
    rows.forEach((row) => row.data && m.set(`${row.q.owner}/${row.q.name}`.toLowerCase(), row.data));
    return m;
  }, [rows]);

  const languages = useMemo(() => {
    const s = new Set<string>();
    for (const r of byKey.values()) if (r.language) s.add(r.language);
    return ["All", ...[...s].sort()];
  }, [byKey]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = hub.list
      .map((r, i) => ({ r, i, d: byKey.get(repoKey(r)) }))
      .filter(({ r, d }) => {
        if (lang !== "All" && d?.language !== lang) return false;
        if (!needle) return true;
        return `${r.owner}/${r.name} ${d?.description ?? ""} ${(d?.topics ?? []).join(" ")}`.toLowerCase().includes(needle);
      });
    const val = (d: GhRepo | undefined) => {
      if (!d) return -1;
      switch (sort) {
        case "stars":
          return d.stars;
        case "forks":
          return d.forks;
        case "issues":
          return d.openIssues;
        case "pushed":
          return Date.parse(d.pushedAt) || 0;
        case "pulse":
          return pulse(d);
        default:
          return 0;
      }
    };
    if (sort !== "added") list.sort((a, b) => val(b.d) - val(a.d) || a.i - b.i);
    return list;
  }, [hub.list, byKey, q, lang, sort]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const ref = parseRepo(adding);
    if (!ref) {
      setMsg({ ok: false, text: "Type a repository as owner/name or paste its GitHub link." });
      return;
    }
    if (hub.has(ref)) {
      setMsg({ ok: false, text: `${ref.owner}/${ref.name} is already in your hub.` });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const d = await ghGet<GhRepo>({ op: "repo", owner: ref.owner, name: ref.name });
      const canonical = parseRepo(d.fullName) ?? ref;
      const r = hub.add(canonical);
      setMsg(r === "added" ? { ok: true, text: `Added ${canonical.owner}/${canonical.name}.` } : r === "full" ? { ok: false, text: `Your hub holds up to ${MAX_HUB} repositories. Remove one first.` } : { ok: false, text: "Already in your hub." });
      if (r === "added") setAdding("");
    } catch (err) {
      setMsg({ ok: false, text: ghWords(err) });
    } finally {
      setBusy(false);
    }
  }

  const seedArea = (owner: string, name: string) => SEED_REPOS.find((s) => s.owner === owner && s.name === name)?.area;

  return (
    <div data-testid="hub">
      <div className="cm-search">
        <SearchIcon size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search your hub: "contracts", "runtime", "rust"' aria-label="Search your hub" data-testid="hub-search" />
      </div>
      <div className="cm-filters mt-4" role="group" aria-label="Language">
        {languages.map((l) => (
          <button key={l} type="button" className={`cm-filter${lang === l ? " on" : ""}`} onClick={() => setLang(l)}>
            {l}
          </button>
        ))}
      </div>
      <div className="cm-filters mt-4">
        <select className="cm-select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="pulse">Sort: Pulse</option>
          <option value="stars">Sort: Stars</option>
          <option value="forks">Sort: Forks</option>
          <option value="pushed">Sort: Last push</option>
          <option value="issues">Sort: Open issues</option>
          <option value="added">Sort: Order added</option>
        </select>
        <form onSubmit={add} className="flex min-w-0 flex-1 flex-wrap gap-2" data-testid="hub-add">
          <input className="cm-select min-w-0 flex-1" style={{ minWidth: 200 }} value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="Add a repo: owner/name or GitHub link" aria-label="Add a repository" />
          <button type="submit" className="cm-btn xs lime" disabled={busy}>
            {busy ? "Checking…" : "Add to hub"}
          </button>
        </form>
      </div>
      {msg ? <p className={`cm-note ${msg.ok ? "ok" : "bad"}`}>{msg.text}</p> : null}
      <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[12px] text-muted">
        <span data-testid="hub-count">
          {shown.length} of {hub.list.length} repos {done < hub.list.length ? `· reading GitHub ${done}/${hub.list.length}` : ""}
        </span>
        <span className="flex flex-wrap items-center gap-3">
          {hub.isSeed ? <span>Starter set · add a repo to make the hub yours</span> : null}
          <button type="button" className="cm-copy" onClick={hub.reset}>
            Reset to starter set
          </button>
          <button type="button" className="cm-copy" onClick={hub.clear}>
            Empty hub
          </button>
        </span>
      </div>
      {shown.length ? (
        <div className="cm-grid">
          {shown.map(({ r }) => (
            <RepoCard key={repoKey(r)} repo={r} area={seedArea(r.owner, r.name)} onRemove={() => hub.remove(r)} />
          ))}
        </div>
      ) : (
        <div className="cm-panel cm-empty">{hub.list.length ? "Nothing in your hub matches that search." : "Your hub is empty. Add a repository above, or reset to the starter set."}</div>
      )}
      <p className="cm-help mt-6">
        Pulse = up to 50 points for how recently the default branch was pushed (halving every 30 days) plus up to 49 for reach (log of stars and forks). It is a reading aid computed from public GitHub numbers, not a quality rating.
      </p>
    </div>
  );
}
