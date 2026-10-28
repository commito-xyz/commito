import { encodeFunctionData, type Abi } from "viem";
import { CONTRACTS, bookLive } from "@/config/contracts";
import { BOOK_ABI } from "@/lib/abi";
import { read, rpcCall, waitForReceipt } from "@/lib/client";
import type { ChainRecord } from "@/lib/records";

/*
 * Reads and writes for CommitoRecordBook. Reads go through the site relay (or the public RPC) with paginated view
 * calls, never log scans. A write is dry-run first, so a transaction that would revert is explained before the
 * wallet opens.
 */

const abi = BOOK_ABI as Abi;
const to = () => CONTRACTS.book;

type RawRecord = {
  id: bigint;
  author: string;
  kind: number;
  role: number;
  reviewCount: number;
  recordedBlock: bigint;
  recordedAt: bigint;
  repoHash: string;
  refHash: string;
  noteHash: string;
  repo: string;
  ref: string;
};

const toRecord = (r: RawRecord): ChainRecord => ({
  id: Number(r.id),
  author: r.author,
  kind: Number(r.kind),
  role: Number(r.role),
  reviewCount: Number(r.reviewCount),
  recordedBlock: Number(r.recordedBlock),
  recordedAt: Number(r.recordedAt),
  repoHash: r.repoHash,
  refHash: r.refHash,
  noteHash: r.noteHash,
  repo: r.repo,
  ref: r.ref,
});

export async function bookTotals() {
  const [records, reviews, authors] = await Promise.all([
    read<bigint>({ to: to(), abi, fn: "recordCount" }),
    read<bigint>({ to: to(), abi, fn: "totalReviews" }),
    read<bigint>({ to: to(), abi, fn: "authorCount" }),
  ]);
  return { records: Number(records), reviews: Number(reviews), authors: Number(authors) };
}

/** The newest `max` records, newest first. */
export async function latestRecords(max = 30): Promise<{ rows: ChainRecord[]; total: number }> {
  const total = Number(await read<bigint>({ to: to(), abi, fn: "recordCount" }));
  if (total === 0) return { rows: [], total };
  const from = Math.max(1, total - max + 1);
  const raw = await read<readonly RawRecord[]>({ to: to(), abi, fn: "records", args: [BigInt(from), BigInt(max)] });
  return { rows: raw.map(toRecord).reverse(), total };
}

export async function getRecord(id: number): Promise<ChainRecord> {
  return toRecord(await read<RawRecord>({ to: to(), abi, fn: "getRecord", args: [BigInt(id)] }));
}

async function recordsByIds(ids: readonly bigint[]): Promise<ChainRecord[]> {
  const out: ChainRecord[] = [];
  for (const id of ids) out.push(await getRecord(Number(id)));
  return out;
}

/** Up to 100 records of one wallet, newest first. */
export async function recordsOf(author: string): Promise<ChainRecord[]> {
  const n = Number(await read<bigint>({ to: to(), abi, fn: "countByAuthor", args: [author] }));
  if (n === 0) return [];
  const offset = Math.max(0, n - 100);
  const ids = await read<readonly bigint[]>({ to: to(), abi, fn: "idsByAuthor", args: [author, BigInt(offset), 100n] });
  return (await recordsByIds(ids)).reverse();
}

/** Up to 100 records for one repository (by hash of its lower-case path), newest first. */
export async function recordsForRepo(hash: string): Promise<ChainRecord[]> {
  const n = Number(await read<bigint>({ to: to(), abi, fn: "countForRepo", args: [hash] }));
  if (n === 0) return [];
  const offset = Math.max(0, n - 100);
  const ids = await read<readonly bigint[]>({ to: to(), abi, fn: "idsForRepo", args: [hash, BigInt(offset), 100n] });
  return (await recordsByIds(ids)).reverse();
}

export type ChainReview = { reviewer: string; reviewedBlock: number; reviewedAt: number };

export async function reviewsOf(id: number): Promise<ChainReview[]> {
  const raw = await read<readonly { reviewer: string; reviewedBlock: bigint; reviewedAt: bigint }[]>({ to: to(), abi, fn: "reviewsOf", args: [BigInt(id), 0n, 100n] });
  return raw.map((r) => ({ reviewer: r.reviewer, reviewedBlock: Number(r.reviewedBlock), reviewedAt: Number(r.reviewedAt) }));
}

type Send = (tx: { to?: string; data: string }) => Promise<string>;

async function sendChecked(from: string, data: string, send: Send) {
  // Dry run first: a revert is explained before the wallet asks for a signature.
  await rpcCall("eth_call", [{ from, to: to(), data }, "latest"]);
  const hash = await send({ to: to(), data });
  const r = await waitForReceipt(hash);
  if (!r.ok) throw new Error("The transaction reverted on chain.");
  return { hash, block: r.blockNumber };
}

export function sendRecord(from: string, rec: { repo: string; ref: string; kind: number; role: number; noteHash: string }, send: Send) {
  const data = encodeFunctionData({ abi, functionName: "record", args: [rec.repo, rec.ref, rec.kind, rec.role, rec.noteHash] } as never);
  return sendChecked(from, data, send);
}

export function sendReview(from: string, id: number, send: Send) {
  const data = encodeFunctionData({ abi, functionName: "review", args: [BigInt(id)] } as never);
  return sendChecked(from, data, send);
}

export { bookLive };
