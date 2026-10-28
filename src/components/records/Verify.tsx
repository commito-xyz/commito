"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CHAIN, explorerAddress, shortAddress } from "@/config/brand";
import { bookLive } from "@/config/contracts";
import { getRecord } from "@/lib/book";
import { ghGet, ghWords } from "@/lib/gh-client";
import { parseRepo, repoKey, type GhCommit, type GhPull } from "@/lib/github";
import { compareRecord, KIND, KIND_LABEL, refHash, repoHash, roleLabel, type ChainRecord } from "@/lib/records";

/*
 * Verify: recompute a record's hashes in this browser from the repository path and the commit SHA or PR number,
 * compare them with the record book, and check that the reference exists on GitHub.
 */
export function Verify() {
  const params = useSearchParams();
  const [id, setId] = useState(() => params.get("id") ?? "");
  const [repoText, setRepoText] = useState("");
  const [refText, setRefText] = useState("");
  const [rec, setRec] = useState<ChainRecord | null>(null);
  const [gh, setGh] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const repo = parseRepo(repoText);
  const key = repo ? repoKey(repo) : "";
  const ref = refText.trim().replace(/^#/, "").toLowerCase();

  async function load() {
    setErr(null);
    setRec(null);
    setGh(null);
    const n = Number(id);
    if (!Number.isInteger(n) || n < 1) return setErr("Type a record number (1 or higher).");
    if (!bookLive()) return setErr("The record book is not deployed yet, so there are no on-chain records to verify. You can still compute hashes below.");
    setBusy(true);
    try {
      const r = await getRecord(n);
      setRec(r);
      if (!repoText) setRepoText(r.repo);
      if (!refText) setRefText(r.ref);
      const [o, nm] = r.repo.split("/");
      try {
        if (r.kind === KIND.commit) {
          const c = await ghGet<GhCommit>({ op: "commit", owner: o, name: nm, ref: r.ref });
          setGh(`GitHub: commit exists · ${c.message.slice(0, 80)} · by ${c.login || c.author}`);
        } else {
          const p = await ghGet<GhPull>({ op: "pull", owner: o, name: nm, ref: r.ref });
          setGh(`GitHub: pull request #${p.number} exists · ${p.title.slice(0, 80)} · ${p.state} · by ${p.login}`);
        }
      } catch (e) {
        setGh(`GitHub: ${ghWords(e)}`);
      }
    } catch {
      setErr(`Record #${n} was not found on ${CHAIN.name}.`);
    } finally {
      setBusy(false);
    }
  }

  const cmp = rec && key && ref ? compareRecord(rec, key, ref) : null;
  const yes = (b: boolean) => <span className={b ? "lime" : "text-[#ff6b5e]"}>{b ? "match" : "no match"}</span>;

  return (
    <div className="cm-two mt-0" data-testid="verify">
      <div className="cm-panel">
        <h3>Record</h3>
        <label className="cm-field">
          Record number
          <input value={id} onChange={(e) => setId(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 1" inputMode="numeric" data-testid="verify-id" />
        </label>
        <button type="button" className="cm-btn sm lime mt-4" onClick={load} disabled={busy} data-testid="verify-load">
          {busy ? "Reading…" : "Read from the record book"}
        </button>
        {err ? <p className="cm-note bad">{err}</p> : null}
        {rec ? (
          <div className="mt-4 font-mono text-[12.5px] leading-7 text-[#bdbdbd]" style={{ overflowWrap: "anywhere" }} data-testid="verify-record">
            <div>
              author{" "}
              <a className="underline" href={explorerAddress(rec.author)} target="_blank" rel="noreferrer">
                {shortAddress(rec.author, 8, 6)}
              </a>{" "}
              · {roleLabel(rec.role)}
            </div>
            <div>
              {rec.repo} · {KIND_LABEL[rec.kind]} {rec.ref}
            </div>
            <div>repoHash {rec.repoHash}</div>
            <div>refHash {rec.refHash}</div>
            <div>noteHash {rec.noteHash}</div>
            <div>
              block {rec.recordedBlock.toLocaleString("en-US")} · {rec.reviewCount} review{rec.reviewCount === 1 ? "" : "s"}
            </div>
            {gh ? <div className="lime">{gh}</div> : null}
          </div>
        ) : null}
      </div>
      <div className="cm-panel">
        <h3>Recompute</h3>
        <label className="cm-field">
          Repository (owner/name)
          <input value={repoText} onChange={(e) => setRepoText(e.target.value)} placeholder="owner/name" data-testid="verify-repo" />
        </label>
        <label className="cm-field">
          Commit SHA (full) or PR number
          <input value={refText} onChange={(e) => setRefText(e.target.value)} placeholder="40 hex characters or a number" data-testid="verify-ref" />
        </label>
        <div className="mt-4 font-mono text-[12.5px] leading-7 text-[#bdbdbd]" style={{ overflowWrap: "anywhere" }} data-testid="verify-hashes">
          <div>keccak256(&quot;{key || "owner/name"}&quot;) = {key ? repoHash(key) : "—"}</div>
          <div>keccak256(&quot;{ref || "ref"}&quot;) = {ref ? refHash(ref) : "—"}</div>
          {cmp ? (
            <>
              <div>repository {yes(cmp.repoMatches)}</div>
              <div>reference {yes(cmp.refMatches)}</div>
              <div>stored text hashes to stored hashes {yes(cmp.storedRepoHashes && cmp.storedRefHashes)}</div>
            </>
          ) : null}
        </div>
        <p className="cm-help">Hashes are keccak-256 of the exact lower-case text, the same rule the contract uses. Nothing here is sent anywhere.</p>
      </div>
    </div>
  );
}
