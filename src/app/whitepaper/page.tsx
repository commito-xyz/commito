import Link from "next/link";
import { BRAND, CHAIN } from "@/config/brand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageHead } from "@/components/site/PageHead";
import { Toc } from "@/components/docs/Toc";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/whitepaper",
  title: `Whitepaper | ${BRAND.name}`,
  description: `The ${BRAND.name} whitepaper: why open-source work needs a checkable record, how the record book on ${CHAIN.name} and second-wallet reviews work, and the plan.`,
  type: "article",
});

const TOC = [
  { id: "summary", label: "Summary" },
  { id: "problem", label: "The problem" },
  { id: "idea", label: "The idea" },
  { id: "system", label: "The system" },
  { id: "pulse", label: "Pulse" },
  { id: "trust", label: "Trust & abuse" },
  { id: "token", label: "Token" },
  { id: "roadmap", label: "Roadmap" },
  { id: "risks", label: "Risks" },
];

const ROADMAP = [
  ["0 · Hub", "Repository Hub, Commit Explorer, Pull Request Workspace, Contributor Dashboard, Open-Source Tasks, all on public GitHub data", "Live"],
  ["1 · Records", "CommitoRecordBook on Robinhood Chain: record, second-wallet review, verify page (practice mode until deployment)", "Built, deployment pending"],
  ["2 · Connect", "Connect repositories you own or may read, with your permission; team views", "Planned"],
  ["3 · Developer API", "Contribution data per repository, wallet and reviewer; webhooks; export", "Planned"],
  ["4 · Agent tools", "Tools for coding assistants to search a hub and prepare records; signing stays with the person", "Planned"],
  [`5 · ${BRAND.symbol} uses`, "API credits, premium workspace, consented wallet-to-account verification", "Planned"],
];

export default function WhitepaperPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap">
        <PageHead eyebrow="Whitepaper · v0.1" title="Build open. Ship together." lead={`Why open-source work deserves a record anyone can check, how ${BRAND.name} keeps that record small and honest, and what comes next.`} />
        <div className="cm-doc">
          <Toc items={TOC} />
          <article className="cm-prose">
            <h2 id="summary">Summary</h2>
            <p>
              {BRAND.name} is a workspace for people who build and maintain open-source software. It gathers what happens in the repositories you follow, commits, pull requests, contributors and open issues, into one view read live from GitHub. On top of that it offers one small on-chain primitive: a contribution record that points at a real commit or pull request, signed by the person who did the work, which another person can co-sign as reviewer.
            </p>
            <p>
              The code never moves. Only references and hashes go to {CHAIN.name}, where they stay public and checkable without asking {BRAND.name} for anything.
            </p>
            <h2 id="problem">The problem</h2>
            <ul>
              <li>
                <b>Work is scattered.</b> A contributor active in five projects has five notification streams, five issue trackers and no single picture of what is moving.
              </li>
              <li>
                <b>Reviews disappear.</b> Reviewing is real work, yet it leaves little trace outside the repository where it happened, and nothing a reviewer can point to later.
              </li>
              <li>
                <b>Claims are hard to check.</b> &quot;I contributed to X&quot; on a profile is easy to write. Checking it means digging through history by hand.
              </li>
              <li>
                <b>Newcomers cannot find a start.</b> Good first issues exist, but they are spread across repositories nobody follows yet.
              </li>
            </ul>
            <h2 id="idea">The idea</h2>
            <p>
              Keep GitHub as the home of the code and the conversation, and add two thin layers: a reading layer that merges what you follow, and a recording layer that lets people sign what they did and what they checked. Each record is small enough to verify in a browser in seconds, and a review is meaningful only because it comes from a different wallet that put its own signature next to the work.
            </p>
            <h2 id="system">The system</h2>
            <h3>1. Repository Hub</h3>
            <p>
              A list of public repositories kept in your browser. For each one the site reads stars, forks, open issues, languages, topics, license and the last push from the public GitHub REST API. Answers are cached on the server for minutes; when the anonymous quota is used up, your browser reads GitHub with its own quota. Without any configuration this needs no account and no key.
            </p>
            <h3>2. Workspaces and contributors</h3>
            <p>
              The Commit Explorer, the Pull Request Workspace and Open-Source Tasks merge the same questions across the first eight repositories of your hub. Pull requests show their state and, on request, their review trail: who approved, who asked for changes. The Contributor Dashboard merges GitHub&apos;s contributor lists by login.
            </p>
            <h3>3. Contribution records</h3>
            <p>
              CommitoRecordBook is a contract with no owner, no admin, no fee and no upgrade path. <code className="cm-code">record(repo, ref, kind, role, noteHash)</code> stores the lower-case repository path, the full commit SHA or pull request number, a role and the hash of an optional note, and computes the hashes itself. A wallet can record each exact reference once. <code className="cm-code">review(id)</code> lets any other wallet co-sign a record, once. Everything is readable with paginated view calls, and block numbers come from {CHAIN.name}&apos;s own L2 counter.
            </p>
            <h3>4. Verify</h3>
            <p>
              The verify page reads a record, recomputes keccak-256 of the repository path and the reference in your browser, compares them with the chain, and checks on GitHub that the commit or pull request exists.
            </p>
            <h2 id="pulse">Pulse</h2>
            <p>
              Repository cards show a Pulse from 0 to 99, a reading aid computed only from public numbers: up to 50 points for recency (50 × 0.5^(days since last push ÷ 30)) and up to 49 for reach (49 × log10(1 + stars + forks) ÷ 5.5, capped). Archived repositories score 0. Pulse says how alive and visible a project is; it says nothing about code quality, and it never decides what you see first unless you sort by it.
            </p>
            <h2 id="trust">Trust &amp; abuse</h2>
            <ul>
              <li>A record proves that a wallet made a claim at a moment, not that the wallet belongs to the GitHub author. Link your wallet from your GitHub profile if you want others to make that connection.</li>
              <li>Anyone can create wallets, so a review is only as strong as the reviewer behind it. Every review shows its address; judge reviewers, not counts.</li>
              <li>The book refuses self-reviews and counts each reviewer once per record. There is no admin who could delete, edit or hide a record, so nothing can be quietly changed later; it also means mistakes stay public.</li>
              <li>Notes never go on chain, only their hash. Do not record anything you would not want to be public forever.</li>
            </ul>
            <h2 id="token">Token</h2>
            <p>
              {BRAND.symbol} is the community token of {BRAND.name} on {CHAIN.name}. Today no feature depends on it. Its possible uses, credits for the planned Developer API, a premium workspace and consented verification services, are plans, and they will be described here before anything goes live. The token carries no promise of value, income or reward. <Link href="/token">Token page</Link>.
            </p>
            <h2 id="roadmap">Roadmap</h2>
            <div className="cm-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Delivers</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {ROADMAP.map((r) => (
                    <tr key={r[0]}>
                      <td className="whitespace-nowrap">{r[0]}</td>
                      <td className="font-sans text-[13px] text-[#bdbdbd]">{r[1]}</td>
                      <td>
                        <span className={`cm-tag ${r[2] === "Live" ? "live" : r[2] === "Planned" ? "planned" : ""}`}>{r[2]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 id="risks">Risks</h2>
            <ul>
              <li>Records and reviews are public and permanent on {CHAIN.name}. They cannot be edited or removed by anyone, including the {BRAND.name} team.</li>
              <li>The record book is small and fully tested, but it has not been through an independent security review yet. It holds no funds.</li>
              <li>GitHub data can be delayed by caching, limited by rate limits, or change after you read it. Always open the original on GitHub.</li>
              <li>{BRAND.symbol} is a community memecoin. It has no promised value, returns, revenue share or reward, and its price can go to zero. Never put in money you need.</li>
              <li>Planned features may change or never ship.</li>
            </ul>
            <div className="h-24" />
          </article>
        </div>
      </main>
      <SiteFooter active="/whitepaper" />
    </>
  );
}
