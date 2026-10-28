import Link from "next/link";
import { BRAND, CHAIN } from "@/config/brand";
import { CONTRACTS, bookLive } from "@/config/contracts";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageHead } from "@/components/site/PageHead";
import { CodeBox } from "@/components/docs/CodeBox";
import { Toc } from "@/components/docs/Toc";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/developers",
  title: `For developers | ${BRAND.name}`,
  description: `Read ${BRAND.name} contribution records straight from Robinhood Chain: contract functions, hash rules and examples. The ${BRAND.name} Developer API and agent tools are planned.`,
});

const TOC = [
  { id: "read", label: "Read records" },
  { id: "contract", label: "Contract" },
  { id: "hashes", label: "Hash rules" },
  { id: "write", label: "Write" },
  { id: "api", label: "Developer API" },
  { id: "agents", label: "Agent tools" },
  { id: "llms", label: "llms.txt" },
];

const address = bookLive() ? CONTRACTS.book : "0x… (published after deployment)";

const READ = `import { createPublicClient, http, parseAbi } from "viem";

const client = createPublicClient({
  transport: http("${CHAIN.publicRpc}"), // chain id ${CHAIN.id}
});

const book = {
  address: "${address}",
  abi: parseAbi([
    "function recordCount() view returns (uint256)",
    "function getRecord(uint256 id) view returns ((uint256 id, address author, uint8 kind, uint8 role, uint32 reviewCount, uint64 recordedBlock, uint64 recordedAt, bytes32 repoHash, bytes32 refHash, bytes32 noteHash, string repo, string ref))",
    "function reviewsOf(uint256 id, uint256 offset, uint256 limit) view returns ((address reviewer, uint64 reviewedBlock, uint64 reviewedAt)[])",
  ]),
};

const total = await client.readContract({ ...book, functionName: "recordCount" });
const last = await client.readContract({ ...book, functionName: "getRecord", args: [total] });
const reviewers = await client.readContract({ ...book, functionName: "reviewsOf", args: [total, 0n, 100n] });`;

const HASH = `import { keccak256, stringToBytes } from "viem";

const repoHash = keccak256(stringToBytes("ethereum/go-ethereum"));   // lower-case owner/name
const refHash  = keccak256(stringToBytes("4f1c...e09a"));            // full 40-char SHA, or "1024" for PR #1024
// countForRepo(repoHash) and idsForRepo(repoHash, offset, limit) list the records of one repository.`;

const ROWS = [
  ["record(repo, ref, kind, role, noteHash)", "write", "kind 1 = commit (40-char lower-case SHA), 2 = pull request (number). Role 1 to 6. One record per wallet per exact reference."],
  ["review(id)", "write", "Co-sign record id. Any wallet except its author, once per wallet."],
  ["recordCount() / records(fromId, limit)", "read", "Total and pages of up to 100 records with their plain references."],
  ["getRecord(id)", "read", "One record: author, kind, role, review count, block, time, hashes, repo, ref."],
  ["idsByAuthor / idsForRepo", "read", "Record ids of a wallet or of a repository hash, oldest first, 100 per page."],
  ["reviewsOf(id, offset, limit)", "read", "Reviewer addresses with block and time."],
  ["idOf(author, repoHash, refHash, kind)", "read", "The record id for an exact reference, or 0."],
];

export default function DevelopersPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap">
        <PageHead eyebrow="For developers" title="Read the records with any client." lead={`Contribution records sit in one small contract on ${CHAIN.name} with no owner and no key. You do not need ${BRAND.name}'s servers to read or check them.`} />
        <div className="cm-doc">
          <Toc items={TOC} />
          <div className="cm-prose">
            <h2 id="read">Read records</h2>
            <p>
              Any JSON-RPC endpoint for {CHAIN.name} works. The example uses viem; ethers or a plain <code className="cm-code">eth_call</code> work the same way. {bookLive() ? "" : "The record book is not deployed yet, so the address below is a placeholder until the deployment is published here."}
            </p>
            <CodeBox label="read.ts" code={READ} />
            <h2 id="contract">Contract</h2>
            <p>
              <b>CommitoRecordBook</b>, Solidity 0.8.28. No owner, no admin, no fee, no pause, no upgrade path, no constructor arguments. It never holds funds and does not use the {BRAND.symbol} token. Block numbers come from {CHAIN.name}&apos;s own L2 counter (ArbSys), not from the parent chain.
            </p>
            <div className="cm-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Function</th>
                    <th>Type</th>
                    <th>What it does</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r[0]}>
                      <td>{r[0]}</td>
                      <td>{r[1]}</td>
                      <td className="font-sans text-[13px] text-[#bdbdbd]">{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 id="hashes">Hash rules</h2>
            <p>Hashes are keccak-256 of the exact UTF-8 text. Repositories are lower case, because GitHub treats names without regard to case. The contract computes the hashes itself from the strings it is given, so the stored text and the stored hashes always agree.</p>
            <CodeBox label="hashes.ts" code={HASH} />
            <p>
              The <Link href="/verify">verify page</Link> does exactly this in your browser.
            </p>
            <h2 id="write">Write</h2>
            <p>
              Writes are ordinary transactions from the contributor&apos;s or reviewer&apos;s own wallet. The site dry-runs each call first, so a mistake such as reviewing your own record is explained before the wallet opens. Gas is the only cost.
            </p>
            <h2 id="api">
              Developer API <span className="cm-tag planned align-middle">planned</span>
            </h2>
            <p>A hosted API with contribution data per repository, wallet and reviewer, webhooks for new records and bulk export is planned. It does not exist yet; nothing on this site sells access to it. Until then, read the chain directly as shown above.</p>
            <h2 id="agents">
              Agent tools <span className="cm-tag planned align-middle">planned</span>
            </h2>
            <p>A tool server that lets coding assistants search your hub, read pull request reviews and prepare (never sign) a contribution record is planned. Any action that writes on chain would still need the person&apos;s own wallet signature.</p>
            <h2 id="llms">llms.txt</h2>
            <p>
              A plain-text summary of {BRAND.name} for language models and crawlers lives at <Link href="/llms.txt" prefetch={false}>/llms.txt</Link>.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter active="/developers" />
    </>
  );
}
