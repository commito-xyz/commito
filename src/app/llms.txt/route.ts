import { BRAND, CHAIN, TOKEN } from "@/config/brand";
import { CONTRACTS, bookLive } from "@/config/contracts";

export const dynamic = "force-static";

/** Plain-text summary for language models and crawlers. */
export function GET() {
  const lines = [
    `# ${BRAND.name}`,
    "",
    `> ${BRAND.slogan} ${BRAND.tagline}`,
    "",
    `${BRAND.name} is an open-source workspace on ${CHAIN.name} (chain id ${CHAIN.id}). It reads public GitHub data (repositories, commits, pull requests, reviews, contributors, issues labelled "good first issue" or "help wanted") and lets a wallet record a reference to a commit or pull request it worked on. A different wallet can co-sign the record as reviewer. No source code is stored on chain.`,
    "",
    "## Pages",
    `- ${BRAND.url}/explore: Repository Hub (list kept in the visitor's browser)`,
    `- ${BRAND.url}/commits, /pulls, /tasks: workspaces across the hub`,
    `- ${BRAND.url}/contributors: Contributor Dashboard`,
    `- ${BRAND.url}/record: record a contribution`,
    `- ${BRAND.url}/records: read and review records`,
    `- ${BRAND.url}/verify: recompute record hashes`,
    `- ${BRAND.url}/developers: contract functions and hash rules`,
    `- ${BRAND.url}/whitepaper: design, roadmap and risks`,
    "",
    "## Contract",
    `- CommitoRecordBook: ${bookLive() ? CONTRACTS.book : "not deployed yet"}`,
    "- record(string repo, string ref, uint8 kind, uint8 role, bytes32 noteHash); review(uint256 id); getRecord(uint256 id); records(uint256 fromId, uint256 limit)",
    "- repoHash = keccak256(lower-case owner/name); refHash = keccak256(full 40-char SHA or PR number)",
    "",
    "## Token",
    `- ${BRAND.symbol}: ${TOKEN.isLive ? BRAND.ca : "not launched yet"}. Community token with no promised value. Developer API, premium workspace and ${BRAND.symbol} credits are planned, not live.`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
