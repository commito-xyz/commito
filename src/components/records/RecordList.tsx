"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePractice, type PracticeRecord } from "@/components/records/usePractice";
import { useWalletModal } from "@/components/wallet/WalletButton";
import { useWallet } from "@/components/wallet/WalletProvider";
import { CHAIN, explorerAddress, explorerTx, shortAddress } from "@/config/brand";
import { bookLive } from "@/config/contracts";
import { latestRecords, recordsForRepo, recordsOf, reviewsOf, sendReview, type ChainReview } from "@/lib/book";
import { explain } from "@/lib/client";
import { ago } from "@/lib/format";
import { parseRepo, repoKey } from "@/lib/github";
import { KIND, KIND_LABEL, repoHash, roleLabel, type ChainRecord } from "@/lib/records";

type Row = {
  id: string;
  author: string;
  repo: string;
  ref: string;
  kind: number;
  role: number;
  at: number;
  reviews: number;
  reviewers?: string[];
  practice: boolean;
  block?: number;
};

const fromChain = (r: ChainRecord): Row => ({ id: String(r.id), author: r.author, repo: r.repo, ref: r.ref, kind: r.kind, role: r.role, at: r.recordedAt, reviews: r.reviewCount, practice: false, block: r.recordedBlock });
const fromPractice = (r: PracticeRecord): Row => ({ id: r.id, author: r.author, repo: r.repo, ref: r.ref, kind: r.kind, role: r.role, at: Math.floor(r.at / 1000), reviews: r.reviews.length, reviewers: r.reviews.map((x) => x.reviewer), practice: true });

/** Wall-clock time for a signature, outside render. */
const nowMs = () => Date.now();

const githubLink = (r: Row) => (r.kind === KIND.commit ? `https://github.com/${r.repo}/commit/${r.ref}` : `https://github.com/${r.repo}/pull/${r.ref}`);

function Reviews({ id }: { id: number }) {
  const [list, setList] = useState<ChainReview[] | null>(null);
  useEffect(() => {
    let live = true;
    reviewsOf(id)
      .then((r) => live && setList(r))
      .catch(() => live && setList([]));
    return () => {
      live = false;
    };
  }, [id]);
  if (!list) return <span className="m">reading reviewers…</span>;
  return (
    <span className="m">
      {list.length
        ? list.map((r) => (
            <a key={r.reviewer} className="mr-2 underline" href={explorerAddress(r.reviewer)} target="_blank" rel="noreferrer">
              {shortAddress(r.reviewer, 6, 4)}
            </a>
          ))
        : "no reviewers yet"}
    </span>
  );
}

export function RecordList() {
  const params = useSearchParams();
  const repoParam = parseRepo(params.get("repo") ?? "");
  const repoFilter = repoParam ? repoKey(repoParam) : "";
  const { address, onRobinhoodChain, switchNetwork, sendTransaction, signMessage } = useWallet();
  const { open } = useWalletModal();
  const practice = usePractice();
  const [view, setView] = useState<"latest" | "mine">("latest");
  const [chainRows, setChainRows] = useState<Row[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; link?: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    if (!bookLive()) return;
    try {
      if (repoFilter) setChainRows((await recordsForRepo(repoHash(repoFilter))).map(fromChain));
      else if (view === "mine" && address) setChainRows((await recordsOf(address)).map(fromChain));
      else {
        const r = await latestRecords(40);
        setChainRows(r.rows.map(fromChain));
        setTotal(r.total);
      }
      setErr(null);
    } catch {
      setErr("The record book could not be read right now. Try again shortly.");
    }
  }, [repoFilter, view, address]);

  useEffect(() => {
    // Deferred one tick so the read never sets state inside the effect body itself.
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load, tick]);

  const rows: Row[] = useMemo(() => {
    if (bookLive()) return chainRows ?? [];
    let list = practice.list.map(fromPractice);
    if (repoFilter) list = list.filter((r) => r.repo === repoFilter);
    if (view === "mine" && address) list = list.filter((r) => r.author.toLowerCase() === address.toLowerCase());
    return list;
  }, [chainRows, practice.list, repoFilter, view, address]);

  async function review(r: Row) {
    if (!address) return open();
    setBusy(r.id);
    setMsg(null);
    try {
      if (r.author.toLowerCase() === address.toLowerCase()) throw new Error("A record cannot be reviewed by the wallet that made it. Switch to a second wallet to co-sign.");
      if (r.practice) {
        if (r.reviewers?.some((x) => x.toLowerCase() === address.toLowerCase())) throw new Error("This wallet already co-signed that record.");
        const at = nowMs();
        const signature = await signMessage(`Commito review (practice, not on chain)\nRecord: ${r.id}\nRepository: ${r.repo}\n${KIND_LABEL[r.kind]}: ${r.ref}\nReviewer: ${address}\nTime: ${new Date(at).toISOString()}`);
        practice.review(r.id, { reviewer: address, at, signature });
        setMsg({ ok: true, text: "Practice review signed and saved in this browser." });
      } else {
        const { hash } = await sendReview(address, Number(r.id), sendTransaction);
        setMsg({ ok: true, text: `Review of record #${r.id} is on chain.`, link: explorerTx(hash) });
        setTick((t) => t + 1);
      }
    } catch (e) {
      setMsg({ ok: false, text: explain(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div data-testid="record-list">
      {!bookLive() ? (
        <p className="cm-panel hot mb-4 font-mono text-[13px]" data-testid="practice-banner">
          Practice mode · the record book is not deployed yet. You see the practice records saved in this browser; reviews are wallet signatures kept here too.
        </p>
      ) : null}
      <div className="cm-filters mb-4">
        <button type="button" className={`cm-filter${view === "latest" ? " on" : ""}`} onClick={() => setView("latest")}>
          {bookLive() ? "Latest records" : "All practice records"}
        </button>
        <button type="button" className={`cm-filter${view === "mine" ? " on" : ""}`} onClick={() => (address ? setView("mine") : open())}>
          My records
        </button>
        {repoFilter ? (
          <Link href="/records" className="cm-filter inline-flex items-center">
            repo: {repoFilter} ✕
          </Link>
        ) : null}
        <span className="ml-auto font-mono text-[12px] text-muted">
          {bookLive() ? (total != null && !repoFilter && view === "latest" ? `${total} records on ${CHAIN.name}` : "") : `${practice.list.length} practice records in this browser`}
        </span>
      </div>
      {bookLive() && address && !onRobinhoodChain ? (
        <p className="cm-note">
          Your wallet is on another network.{" "}
          <button type="button" className="cm-copy" onClick={switchNetwork}>
            Switch to {CHAIN.name}
          </button>
        </p>
      ) : null}
      {msg ? (
        <p className={`cm-note ${msg.ok ? "ok" : "bad"}`} data-testid="list-status">
          {msg.text}{" "}
          {msg.link ? (
            <a className="underline" href={msg.link} target="_blank" rel="noreferrer">
              View transaction
            </a>
          ) : null}
        </p>
      ) : null}
      <div className="cm-panel mt-4 overflow-hidden p-0">
        {err ? <p className="cm-empty">{err}</p> : null}
        {!err && rows.length === 0 ? (
          <p className="cm-empty">
            {bookLive() && chainRows === null ? "Reading the record book…" : "No records here yet."} <Link className="lime" href="/record">Record a contribution →</Link>
          </p>
        ) : null}
        <div className="cm-rows" data-testid="records-rows">
          {rows.map((r) => (
            <div key={r.id} className="cm-row">
              <span className="cm-glyph font-mono text-[12px]" style={{ width: 40, height: 28, borderRadius: 7 }}>
                {r.practice ? "P" : `#${r.id}`}
              </span>
              <span className="min-w-0">
                <span className="t block">
                  <Link href={`/repo/${r.repo}`} className="hover:underline">
                    {r.repo}
                  </Link>{" "}
                  ·{" "}
                  <a className="hover:underline" href={githubLink(r)} target="_blank" rel="noreferrer">
                    {r.kind === KIND.commit ? `commit ${r.ref.slice(0, 7)}` : `PR #${r.ref}`}
                  </a>
                </span>
                <span className="m">
                  {roleLabel(r.role)} · {shortAddress(r.author, 6, 4)} · {ago(r.at)}
                  {r.block ? ` · block ${r.block.toLocaleString("en-US")}` : ""}
                </span>
                {expanded === r.id ? r.practice ? <span className="m">{r.reviewers?.length ? r.reviewers.map((x) => shortAddress(x, 6, 4)).join(", ") : "no reviewers yet"}</span> : <Reviews id={Number(r.id)} /> : null}
              </span>
              <span className="r">
                <button type="button" className={`cm-tag ${r.reviews ? "live" : ""}`} onClick={() => setExpanded(expanded === r.id ? null : r.id)} aria-expanded={expanded === r.id}>
                  {r.reviews ? `${r.reviews} review${r.reviews > 1 ? "s" : ""}` : "not reviewed"}
                </button>
                <button type="button" className="cm-copy" disabled={busy !== null} onClick={() => review(r)} data-testid="review-btn">
                  {busy === r.id ? "Check wallet…" : "Co-sign review"}
                </button>
                {!r.practice ? (
                  <Link className="cm-copy" href={`/verify?id=${r.id}`}>
                    Verify
                  </Link>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="cm-help mt-4">
        Before you co-sign, open the commit or pull request on GitHub and read it. A review says that this wallet looked at the work; it is not a guarantee of quality, and trust in it depends on who the reviewer is.
      </p>
    </div>
  );
}
