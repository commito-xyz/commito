/*
 * Public GitHub data, shared by the server route (/api/gh) and the browser fallback. Everything here is pure:
 * input checks, the GitHub REST path for each question, and the trimming of GitHub's answers to the few fields the
 * site shows. Nothing is written anywhere; repositories are read, never changed.
 */

export const GH_API = "https://api.github.com";

export type RepoRef = { owner: string; name: string };

const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const NAME = /^[A-Za-z0-9._-]{1,100}$/;
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const SHA = /^[0-9a-fA-F]{7,40}$/;

export const isOwner = (v: string) => OWNER.test(v);
export const isRepoName = (v: string) => NAME.test(v) && v !== "." && v !== "..";
export const isLogin = (v: string) => LOGIN.test(v);
export const isSha = (v: string) => SHA.test(v);
export const isFullSha = (v: string) => /^[0-9a-f]{40}$/.test(v);
export const isPullNumber = (v: string) => /^[1-9][0-9]{0,9}$/.test(v);

/**
 * Reads "owner/name", "github.com/owner/name", a full https URL or one ending in .git. Returns null when the text is
 * not a repository path. Case is kept for display; the canonical form for hashing is lower case (see repoKey).
 */
export function parseRepo(input: string): RepoRef | null {
  let s = input.trim();
  if (!s || s.length > 200) return null;
  s = s.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  if (/^github\.com\//i.test(s)) s = s.slice("github.com/".length);
  s = s.replace(/[?#].*$/, "").replace(/\/+$/, "").replace(/\.git$/i, "");
  const parts = s.split("/");
  if (parts.length < 2) return null;
  const [owner, name] = parts;
  if (!isOwner(owner) || !isRepoName(name)) return null;
  return { owner, name };
}

/** Lower-case "owner/name": the form the record book stores and hashes. */
export const repoKey = (r: RepoRef) => `${r.owner}/${r.name}`.toLowerCase();

/** The questions the site asks GitHub. */
export type GhOp = "repo" | "languages" | "commits" | "pulls" | "reviews" | "contributors" | "tasks" | "commit" | "pull" | "user" | "userRepos";

export type GhQuery = { op: GhOp; owner?: string; name?: string; ref?: string; login?: string; label?: string };

/** Labels the task board reads (GitHub's own conventions for newcomer and help issues). */
export const TASK_LABELS = ["good first issue", "help wanted"] as const;

/** Checks a query and returns the REST path (relative to GH_API), or null when it is not allowed. */
export function ghPath(q: GhQuery): string | null {
  const repoOps: GhOp[] = ["repo", "languages", "commits", "pulls", "reviews", "contributors", "tasks", "commit", "pull"];
  if (repoOps.includes(q.op)) {
    if (!q.owner || !q.name || !isOwner(q.owner) || !isRepoName(q.name)) return null;
    const base = `/repos/${q.owner}/${q.name}`;
    switch (q.op) {
      case "repo":
        return base;
      case "languages":
        return `${base}/languages`;
      case "commits":
        return `${base}/commits?per_page=30`;
      case "pulls":
        return `${base}/pulls?state=all&sort=updated&direction=desc&per_page=30`;
      case "contributors":
        return `${base}/contributors?per_page=30`;
      case "tasks": {
        if (!q.label || !(TASK_LABELS as readonly string[]).includes(q.label)) return null;
        return `${base}/issues?state=open&per_page=20&labels=${encodeURIComponent(q.label)}`;
      }
      case "commit":
        if (!q.ref || !isSha(q.ref)) return null;
        return `${base}/commits/${q.ref.toLowerCase()}`;
      case "pull":
      case "reviews":
        if (!q.ref || !isPullNumber(q.ref)) return null;
        return q.op === "pull" ? `${base}/pulls/${q.ref}` : `${base}/pulls/${q.ref}/reviews?per_page=50`;
    }
  }
  if (q.op === "user" || q.op === "userRepos") {
    if (!q.login || !isLogin(q.login)) return null;
    return q.op === "user" ? `/users/${q.login}` : `/users/${q.login}/repos?sort=pushed&per_page=12&type=owner`;
  }
  return null;
}

/** Cache lifetime per question, in seconds. Slow-moving facts live longer. */
export function ghTtl(op: GhOp): number {
  if (op === "commit" || op === "languages" || op === "user") return 3600;
  if (op === "repo" || op === "contributors" || op === "userRepos") return 900;
  return 300;
}

// ------------------------------------------------------------------ shapes the site uses

export type GhRepo = {
  fullName: string;
  owner: string;
  name: string;
  description: string;
  url: string;
  homepage: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  language: string;
  topics: string[];
  license: string;
  pushedAt: string;
  createdAt: string;
  defaultBranch: string;
  archived: boolean;
  avatar: string;
};

export type GhCommit = { sha: string; message: string; body: string; author: string; login: string; avatar: string; date: string; url: string; verified: boolean };
export type GhPull = { number: number; title: string; state: "open" | "closed" | "merged"; draft: boolean; login: string; avatar: string; created: string; updated: string; url: string; comments: number; reviewers: number };
export type GhReview = { login: string; avatar: string; state: string; at: string };
export type GhContributor = { login: string; avatar: string; contributions: number; url: string };
export type GhTask = { number: number; title: string; login: string; created: string; comments: number; labels: string[]; url: string };
export type GhUser = { login: string; name: string; avatar: string; bio: string; url: string; blog: string; followers: number; publicRepos: number; created: string; type: string };
export type GhUserRepo = { fullName: string; description: string; stars: number; language: string; pushedAt: string; fork: boolean };

type J = Record<string, unknown>;
const str = (v: unknown, max = 400) => (typeof v === "string" ? v.slice(0, max) : "");
const int = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
const obj = (v: unknown): J => (v && typeof v === "object" && !Array.isArray(v) ? (v as J) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
/** Only https links on github.com or githubusercontent.com are passed through as links/images. */
const ghUrl = (v: unknown) => {
  const s = str(v, 500);
  return /^https:\/\/(github\.com|avatars\.githubusercontent\.com)\//.test(s) ? s : "";
};
const webUrl = (v: unknown) => {
  const s = str(v, 300).trim();
  if (!s) return "";
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
};

/** Trims a GitHub answer to the site's shape. Unknown fields are dropped; odd values become empty. */
export function shape(op: GhOp, raw: unknown): unknown {
  switch (op) {
    case "repo": {
      const r = obj(raw);
      const owner = obj(r.owner);
      const full = str(r.full_name, 141);
      return {
        fullName: full,
        owner: str(owner.login, 39),
        name: str(r.name, 100),
        description: str(r.description, 400),
        url: ghUrl(r.html_url),
        homepage: webUrl(r.homepage),
        stars: int(r.stargazers_count),
        forks: int(r.forks_count),
        openIssues: int(r.open_issues_count),
        watchers: int(r.subscribers_count),
        language: str(r.language, 40),
        topics: arr(r.topics).map((t) => str(t, 40)).filter(Boolean).slice(0, 8),
        license: str(obj(r.license).spdx_id, 40),
        pushedAt: str(r.pushed_at, 40),
        createdAt: str(r.created_at, 40),
        defaultBranch: str(r.default_branch, 100),
        archived: r.archived === true,
        avatar: ghUrl(owner.avatar_url),
      } satisfies GhRepo;
    }
    case "languages": {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(obj(raw)).slice(0, 20)) out[k.slice(0, 40)] = int(v);
      return out;
    }
    case "commits":
      return arr(raw).slice(0, 30).map((c) => commitShape(c));
    case "commit":
      return commitShape(raw);
    case "pulls":
      return arr(raw).slice(0, 30).map((p) => pullShape(p));
    case "pull":
      return pullShape(raw);
    case "reviews":
      return arr(raw)
        .slice(0, 50)
        .map((v) => {
          const r = obj(v);
          const u = obj(r.user);
          return { login: str(u.login, 39), avatar: ghUrl(u.avatar_url), state: str(r.state, 30), at: str(r.submitted_at, 40) } satisfies GhReview;
        });
    case "contributors":
      return arr(raw)
        .slice(0, 30)
        .map((v) => {
          const c = obj(v);
          return { login: str(c.login, 39), avatar: ghUrl(c.avatar_url), contributions: int(c.contributions), url: ghUrl(c.html_url) } satisfies GhContributor;
        })
        .filter((c) => c.login);
    case "tasks":
      return arr(raw)
        .map(obj)
        .filter((i) => !i.pull_request)
        .slice(0, 20)
        .map((i) => ({
          number: int(i.number),
          title: str(i.title, 200),
          login: str(obj(i.user).login, 39),
          created: str(i.created_at, 40),
          comments: int(i.comments),
          labels: arr(i.labels).map((l) => str(obj(l).name, 40)).filter(Boolean).slice(0, 6),
          url: ghUrl(i.html_url),
        }) satisfies GhTask);
    case "user": {
      const u = obj(raw);
      return {
        login: str(u.login, 39),
        name: str(u.name, 80),
        avatar: ghUrl(u.avatar_url),
        bio: str(u.bio, 300),
        url: ghUrl(u.html_url),
        blog: webUrl(u.blog),
        followers: int(u.followers),
        publicRepos: int(u.public_repos),
        created: str(u.created_at, 40),
        type: str(u.type, 20),
      } satisfies GhUser;
    }
    case "userRepos":
      return arr(raw)
        .slice(0, 12)
        .map((v) => {
          const r = obj(v);
          return { fullName: str(r.full_name, 141), description: str(r.description, 300), stars: int(r.stargazers_count), language: str(r.language, 40), pushedAt: str(r.pushed_at, 40), fork: r.fork === true } satisfies GhUserRepo;
        });
  }
}

function commitShape(raw: unknown): GhCommit {
  const c = obj(raw);
  const inner = obj(c.commit);
  const author = obj(inner.author);
  const user = obj(c.author);
  const message = str(inner.message, 2000);
  const [first, ...rest] = message.split("\n");
  return {
    sha: str(c.sha, 40),
    message: first.slice(0, 200),
    body: rest.join("\n").trim().slice(0, 600),
    author: str(author.name, 80),
    login: str(user.login, 39),
    avatar: ghUrl(user.avatar_url),
    date: str(author.date, 40),
    url: ghUrl(c.html_url),
    verified: obj(inner.verification).verified === true,
  };
}

function pullShape(raw: unknown): GhPull {
  const p = obj(raw);
  const user = obj(p.user);
  const merged = typeof p.merged_at === "string" && p.merged_at.length > 0;
  return {
    number: int(p.number),
    title: str(p.title, 200),
    state: merged ? "merged" : p.state === "open" ? "open" : "closed",
    draft: p.draft === true,
    login: str(user.login, 39),
    avatar: ghUrl(user.avatar_url),
    created: str(p.created_at, 40),
    updated: str(p.updated_at, 40),
    url: ghUrl(p.html_url),
    comments: int(p.comments),
    reviewers: arr(p.requested_reviewers).length,
  };
}

/** Summary of review states for a pull request: latest state per reviewer, then counted. */
export function reviewSummary(reviews: GhReview[]) {
  const latest = new Map<string, string>();
  for (const r of reviews) if (r.login && r.state !== "COMMENTED" && r.state !== "PENDING") latest.set(r.login, r.state);
  let approved = 0;
  let changes = 0;
  for (const s of latest.values()) {
    if (s === "APPROVED") approved++;
    else if (s === "CHANGES_REQUESTED") changes++;
  }
  const commented = reviews.filter((r) => r.state === "COMMENTED").length;
  return { approved, changes, commented, reviewers: latest.size };
}
