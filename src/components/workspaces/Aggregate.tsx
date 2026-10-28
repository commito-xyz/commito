"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useGhMany } from "@/components/hub/useGh";
import { useHub } from "@/components/hub/useHub";
import { CommitRows, PullRows, Skeleton, TaskRows } from "@/components/repo/Lists";
import { TASK_LABELS, type GhCommit, type GhPull, type GhTask } from "@/lib/github";

/*
 * Workspaces read the first repositories of the visitor's hub (MAX_REPOS, to stay inside GitHub's anonymous
 * quota) and merge the answers. Everything links out to GitHub.
 */
export const MAX_REPOS = 8;

function useRepos() {
  const { list } = useHub();
  return list.slice(0, MAX_REPOS);
}

function Status({ done, total, errors, hubSize }: { done: number; total: number; errors: string[]; hubSize: number }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[12px] text-muted" data-testid="agg-status">
      <span>
        {done < total ? `Reading GitHub ${done}/${total} repos…` : `${total} repos read`}
        {hubSize > MAX_REPOS ? ` · first ${MAX_REPOS} of ${hubSize} in your hub` : ""}
      </span>
      {errors.length ? <span className="text-[#ff6b5e]">{errors[0]}</span> : <Link href="/explore">Edit your hub →</Link>}
    </div>
  );
}

export function CommitsWorkspace() {
  const repos = useRepos();
  const { list } = useHub();
  const { rows, done } = useGhMany<GhCommit[]>(repos.map((r) => ({ op: "commits", owner: r.owner, name: r.name })));
  const items = useMemo(
    () =>
      rows
        .flatMap((row) => (row.data ?? []).map((c) => ({ ...c, repo: `${row.q.owner}/${row.q.name}` })))
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
        .slice(0, 60),
    [rows],
  );
  const errors = rows.map((r) => r.error).filter(Boolean) as string[];
  return (
    <div>
      <Status done={done} total={repos.length} errors={errors} hubSize={list.length} />
      <div className="cm-panel overflow-hidden p-0">
        {done === 0 && repos.length ? (
          <Skeleton rows={6} />
        ) : items.length ? (
          <div className="cm-rows">
            {items.map((c) => (
              <CommitRows key={`${c.repo}-${c.sha}`} items={[c]} repo={c.repo} />
            ))}
          </div>
        ) : (
          <p className="cm-empty">{repos.length ? "No commits read yet." : "Your hub is empty. Add repositories first."}</p>
        )}
      </div>
    </div>
  );
}

export function PullsWorkspace() {
  const repos = useRepos();
  const { list } = useHub();
  const [state, setState] = useState<"all" | "open" | "merged" | "closed">("all");
  const { rows, done } = useGhMany<GhPull[]>(repos.map((r) => ({ op: "pulls", owner: r.owner, name: r.name })));
  const items = useMemo(
    () =>
      rows
        .flatMap((row) => (row.data ?? []).map((p) => ({ ...p, owner: row.q.owner!, name: row.q.name! })))
        .filter((p) => state === "all" || p.state === state)
        .sort((a, b) => Date.parse(b.updated) - Date.parse(a.updated))
        .slice(0, 60),
    [rows, state],
  );
  const errors = rows.map((r) => r.error).filter(Boolean) as string[];
  return (
    <div>
      <div className="cm-filters mb-4">
        {(["all", "open", "merged", "closed"] as const).map((s) => (
          <button key={s} type="button" className={`cm-filter${state === s ? " on" : ""}`} onClick={() => setState(s)}>
            {s === "all" ? "All states" : s}
          </button>
        ))}
      </div>
      <Status done={done} total={repos.length} errors={errors} hubSize={list.length} />
      <div className="cm-panel overflow-hidden p-0">{done === 0 && repos.length ? <Skeleton rows={6} /> : <PullRows items={items} repoLabel />}</div>
    </div>
  );
}

export function TasksWorkspace() {
  const repos = useRepos();
  const { list } = useHub();
  const [label, setLabel] = useState<(typeof TASK_LABELS)[number]>("good first issue");
  const { rows, done } = useGhMany<GhTask[]>(repos.map((r) => ({ op: "tasks", owner: r.owner, name: r.name, label })));
  const items = useMemo(
    () =>
      rows
        .flatMap((row) => (row.data ?? []).map((t) => ({ ...t, repo: `${row.q.owner}/${row.q.name}` })))
        .sort((a, b) => Date.parse(b.created) - Date.parse(a.created))
        .slice(0, 80),
    [rows],
  );
  const errors = rows.map((r) => r.error).filter(Boolean) as string[];
  return (
    <div>
      <div className="cm-filters mb-4">
        {TASK_LABELS.map((l) => (
          <button key={l} type="button" className={`cm-filter${label === l ? " on" : ""}`} onClick={() => setLabel(l)}>
            {l}
          </button>
        ))}
      </div>
      <Status done={done} total={repos.length} errors={errors} hubSize={list.length} />
      <div className="cm-panel overflow-hidden p-0">{done === 0 && repos.length ? <Skeleton rows={6} /> : <TaskRows items={items} repoLabel />}</div>
    </div>
  );
}
