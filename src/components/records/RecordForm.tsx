"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useHub } from "@/components/hub/useHub";
import { usePractice } from "@/components/records/usePractice";
import { useWalletModal } from "@/components/wallet/WalletButton";
import { useWallet } from "@/components/wallet/WalletProvider";
import { CHAIN, explorerTx } from "@/config/brand";
import { bookLive } from "@/config/contracts";
import { sendRecord } from "@/lib/book";
import { explain } from "@/lib/client";
import { ghGet, ghWords } from "@/lib/gh-client";
import { isoAgo } from "@/lib/format";
import { parseRepo, repoKey, type GhCommit, type GhPull } from "@/lib/github";
import { KIND, MAX_NOTE, ROLES, noteHash, practiceMessage, validRef, validRepoKey } from "@/lib/records";

type Checked = { kind: number; repo: string; ref: string; title: string; who: string; when: string; url: string; extra: string };

export function RecordForm() {
  const params = useSearchParams();
  const hub = useHub();
  const practice = usePractice();
  const { address, onRobinhoodChain, switchNetwork, sendTransaction, signMessage } = useWallet();
  const { open } = useWalletModal();

  const [repoText, setRepoText] = useState(() => params.get("repo") ?? "");
  const [kind, setKind] = useState<number>(() => (params.get("kind") === "pr" ? KIND.pull : KIND.commit));
  const [refText, setRefText] = useState(() => params.get("ref") ?? "");
  const [role, setRole] = useState(1);
  const [note, setNote] = useState("");
  const [checked, setChecked] = useState<Checked | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string; link?: string } | null>(null);
  const [busy, setBusy] = useState<"check" | "send" | null>(null);

  const repo = parseRepo(repoText);
  const key = repo ? repoKey(repo) : "";
  const ref = refText.trim().replace(/^#/, "").toLowerCase();
  const formOk = Boolean(repo) && validRepoKey(key) && (kind === KIND.commit ? /^[0-9a-f]{7,40}$/.test(ref) : validRef(KIND.pull, ref));
  const isChecked = checked && checked.repo === key && checked.kind === kind && (kind === KIND.pull ? checked.ref === ref : checked.ref.startsWith(ref));
  const nh = useMemo(() => noteHash(note), [note]);

  async function check() {
    if (!repo || !formOk) return;
    setBusy("check");
    setStatus(null);
    setChecked(null);
    try {
      if (kind === KIND.commit) {
        const c = await ghGet<GhCommit>({ op: "commit", owner: repo.owner, name: repo.name, ref });
        setChecked({ kind, repo: key, ref: c.sha.toLowerCase(), title: c.message || "(no message)", who: c.login || c.author || "unknown", when: c.date, url: c.url, extra: c.verified ? "signed commit" : "" });
        setRefText(c.sha.toLowerCase());
      } else {
        const p = await ghGet<GhPull>({ op: "pull", owner: repo.owner, name: repo.name, ref });
        setChecked({ kind, repo: key, ref: String(p.number), title: p.title, who: p.login || "unknown", when: p.created, url: p.url, extra: p.state });
      }
    } catch (e) {
      setStatus({ ok: false, text: ghWords(e) });
    } finally {
      setBusy(null);
    }
  }

  async function submit() {
    if (!checked || !address) return;
    setBusy("send");
    setStatus(null);
    try {
      const rec = { repo: checked.repo, ref: checked.ref, kind: checked.kind, role, noteHash: nh };
      if (!validRepoKey(rec.repo) || !validRef(rec.kind, rec.ref)) throw new Error("This reference does not fit the record book rules.");
      if (bookLive()) {
        const { hash } = await sendRecord(address, rec, sendTransaction);
        setStatus({ ok: true, text: "Recorded on Robinhood Chain.", link: explorerTx(hash) });
      } else {
        const at = Date.now();
        const exists = practice.list.some((p) => p.author.toLowerCase() === address.toLowerCase() && p.repo === rec.repo && p.ref === rec.ref && p.kind === rec.kind);
        if (exists) throw new Error("This wallet already holds a practice record for that exact reference.");
        const signature = await signMessage(practiceMessage({ ...rec, wallet: address, at }));
        practice.add({ id: `p${at.toString(36)}`, author: address, ...rec, at, signature, reviews: [] });
        setStatus({ ok: true, text: "Practice record signed and saved in this browser. Nothing was sent to the chain." });
      }
      if (repo && !hub.has(repo)) hub.add(repo);
    } catch (e) {
      setStatus({ ok: false, text: explain(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div data-testid="record-form">
      {!bookLive() ? (
        <p className="cm-panel hot mb-4 font-mono text-[13px]" data-testid="practice-banner">
          Practice mode · the record book is not deployed yet. Records are signed with your wallet (no gas, no transaction) and kept in this browser until it goes live.
        </p>
      ) : null}
      <div className="cm-three">
        <div className="cm-panel">
          <span className="cm-step-n">01</span>
          <h3 className="mt-3">The work</h3>
          <label className="cm-field">
            GitHub repository
            <input list="hub-repos" value={repoText} onChange={(e) => setRepoText(e.target.value)} placeholder="owner/name or link" data-testid="rec-repo" />
            <datalist id="hub-repos">
              {hub.list.map((r) => (
                <option key={repoKey(r)} value={repoKey(r)} />
              ))}
            </datalist>
          </label>
          <div className="cm-field">
            Kind of work
            <div className="cm-filters">
              <button type="button" className={`cm-filter${kind === KIND.commit ? " on" : ""}`} onClick={() => setKind(KIND.commit)}>
                Commit
              </button>
              <button type="button" className={`cm-filter${kind === KIND.pull ? " on" : ""}`} onClick={() => setKind(KIND.pull)}>
                Pull request
              </button>
            </div>
          </div>
          <label className="cm-field">
            {kind === KIND.commit ? "Commit SHA (7 to 40 characters)" : "Pull request number"}
            <input value={refText} onChange={(e) => setRefText(e.target.value)} placeholder={kind === KIND.commit ? "e.g. 4f1c2d9" : "e.g. 1024"} data-testid="rec-ref" />
          </label>
          {repoText && !repo ? <p className="cm-note bad">Not a repository path.</p> : null}
        </div>

        <div className="cm-panel">
          <span className="cm-step-n">02</span>
          <h3 className="mt-3">Check it on GitHub</h3>
          <p className="cm-help">We read the commit or pull request from GitHub so the record points at something that exists. A short SHA is expanded to the full one.</p>
          <button type="button" className="cm-btn sm mt-4 w-full" disabled={!formOk || busy !== null} onClick={check} data-testid="rec-check">
            {busy === "check" ? "Reading GitHub…" : "Check on GitHub"}
          </button>
          {isChecked ? (
            <div className="mt-4 border-t border-dashed border-[#ffffff24] pt-4" data-testid="rec-checked">
              <p className="m-0 text-[14px]">{checked!.title}</p>
              <p className="cm-help">
                {checked!.kind === KIND.commit ? checked!.ref.slice(0, 12) : `#${checked!.ref}`} · by {checked!.who} · {isoAgo(checked!.when)} {checked!.extra ? `· ${checked!.extra}` : ""}
              </p>
              {checked!.url ? (
                <a href={checked!.url} target="_blank" rel="noreferrer" className="lime font-mono text-[12px]">
                  Open on GitHub ↗
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="cm-panel">
          <span className="cm-step-n">03</span>
          <h3 className="mt-3">Your part, signed</h3>
          <label className="cm-field">
            Your role
            <select value={role} onChange={(e) => setRole(Number(e.target.value))} data-testid="rec-role">
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="cm-field">
            Note (optional, stays off chain; only its hash is recorded)
            <textarea value={note} maxLength={MAX_NOTE} onChange={(e) => setNote(e.target.value)} placeholder="What you did, in a sentence" />
          </label>
          <p className="cm-help font-mono" style={{ overflowWrap: "anywhere" }}>
            note hash {note.trim() ? `${nh.slice(0, 18)}…` : "none"}
          </p>
          {!address ? (
            <button type="button" className="cm-btn sm lime mt-3 w-full" onClick={open}>
              Connect wallet
            </button>
          ) : bookLive() && !onRobinhoodChain ? (
            <button type="button" className="cm-btn sm mt-3 w-full" onClick={switchNetwork}>
              Switch to {CHAIN.name}
            </button>
          ) : (
            <button type="button" className="cm-btn sm lime mt-3 w-full" disabled={!isChecked || busy !== null} onClick={submit} data-testid="rec-submit">
              {busy === "send" ? "Check your wallet…" : bookLive() ? "Record on chain" : "Sign practice record"}
            </button>
          )}
          {!isChecked ? <p className="cm-help">Check the reference first (step 02).</p> : null}
        </div>
      </div>
      {status ? (
        <p className={`cm-note ${status.ok ? "ok" : "bad"}`} data-testid="rec-status">
          {status.text}{" "}
          {status.link ? (
            <a className="underline" href={status.link} target="_blank" rel="noreferrer">
              View transaction
            </a>
          ) : null}{" "}
          {status.ok ? (
            <Link className="underline" href="/records">
              See your records
            </Link>
          ) : null}
        </p>
      ) : null}
      <div className="cm-panel mt-4">
        <h3>Good to know</h3>
        <ul className="cm-help mt-2 list-disc pl-5 text-[14px] leading-7">
          <li>A record is your claim, signed by your wallet. The book cannot see GitHub, so it does not prove that you are the GitHub author; link your wallet in your GitHub profile or commit messages if you want others to connect the two.</li>
          <li>One record per wallet for each exact reference. Records cannot be edited or deleted: the chain keeps them public for good. Do not put personal data in notes; only the note&apos;s hash goes on chain anyway.</li>
          <li>Recording costs only network gas on {CHAIN.name}. No token, no fee to us, no reward. A reviewer co-signs separately on the records page.</li>
        </ul>
      </div>
    </div>
  );
}
