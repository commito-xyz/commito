import { keccak256, stringToBytes } from "viem";

/*
 * Contribution record rules shared by the record form, the verify page and the tests. They mirror the checks in
 * contracts/src/CommitoRecordBook.sol, so a form that passes here is accepted by the contract.
 */

export const KIND = { commit: 1, pull: 2 } as const;
export type Kind = (typeof KIND)[keyof typeof KIND];
export const KIND_LABEL: Record<number, string> = { 1: "Commit", 2: "Pull request" };

export const ROLES = [
  { id: 1, label: "Author" },
  { id: 2, label: "Co-author" },
  { id: 3, label: "Reviewer" },
  { id: 4, label: "Maintainer" },
  { id: 5, label: "Tester" },
  { id: 6, label: "Documentation" },
] as const;
export const roleLabel = (id: number) => ROLES.find((r) => r.id === id)?.label ?? `Role ${id}`;

export const MAX_REPO_LENGTH = 140;
export const MAX_NOTE = 280;
export const ZERO_HASH = `0x${"0".repeat(64)}` as const;

/** The contract's repository rule: lower-case "owner/name", one slash, owner ≤ 39, total ≤ 140, no "." / ".." parts. */
export function validRepoKey(s: string): boolean {
  if (s.length < 3 || s.length > MAX_REPO_LENGTH) return false;
  if (!/^[a-z0-9._-]+\/[a-z0-9._-]+$/.test(s)) return false;
  const [owner, name] = s.split("/");
  if (owner.length > 39) return false;
  for (const part of [owner, name]) if (part === "." || part === "..") return false;
  return true;
}

/** The contract's reference rule: 40 lower-case hex for a commit, 1–10 digits without a leading zero for a pull request. */
export function validRef(kind: number, ref: string): boolean {
  if (kind === KIND.commit) return /^[0-9a-f]{40}$/.test(ref);
  if (kind === KIND.pull) return /^[1-9][0-9]{0,9}$/.test(ref);
  return false;
}

export const repoHash = (repoKey: string) => keccak256(stringToBytes(repoKey));
export const refHash = (ref: string) => keccak256(stringToBytes(ref));
/** keccak-256 of the note text exactly as typed (trimmed); zero when there is no note. The note itself stays off chain. */
export const noteHash = (note: string) => (note.trim() ? keccak256(stringToBytes(note.trim())) : ZERO_HASH);

/** The message a wallet signs for a practice record (before the contract is deployed). */
export function practiceMessage(r: { repo: string; ref: string; kind: number; role: number; noteHash: string; wallet: string; at: number }) {
  return [
    "Commito contribution record (practice, not on chain)",
    `Repository: ${r.repo}`,
    `${KIND_LABEL[r.kind] ?? "Item"}: ${r.ref}`,
    `Role: ${roleLabel(r.role)}`,
    `Note hash: ${r.noteHash}`,
    `Wallet: ${r.wallet}`,
    `Time: ${new Date(r.at).toISOString()}`,
  ].join("\n");
}

export type ChainRecord = {
  id: number;
  author: string;
  kind: number;
  role: number;
  reviewCount: number;
  recordedBlock: number;
  recordedAt: number;
  repoHash: string;
  refHash: string;
  noteHash: string;
  repo: string;
  ref: string;
};

/** What the verify page reports for a record against the repository and reference typed by the visitor. */
export function compareRecord(rec: Pick<ChainRecord, "repoHash" | "refHash" | "repo" | "ref">, repo: string, ref: string) {
  const rh = repoHash(repo);
  const fh = refHash(ref);
  return {
    repoMatches: rh === rec.repoHash.toLowerCase(),
    refMatches: fh === rec.refHash.toLowerCase(),
    storedRepoHashes: repoHash(rec.repo) === rec.repoHash.toLowerCase(),
    storedRefHashes: refHash(rec.ref) === rec.refHash.toLowerCase(),
    repoHash: rh,
    refHash: fh,
  };
}
