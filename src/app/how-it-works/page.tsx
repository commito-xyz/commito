import Link from "next/link";
import { BRAND, CHAIN } from "@/config/brand";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageHead } from "@/components/site/PageHead";
import { Toc } from "@/components/docs/Toc";
import { faq } from "@/content/faq";
import { faqLd, pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/how-it-works",
  title: `How it works | ${BRAND.name}`,
  description: `How ${BRAND.name} works: follow GitHub repositories, read commits and pull requests, record contributions on ${CHAIN.name} and have them co-signed by a reviewer.`,
});

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "contributors", label: "For contributors" },
  { id: "reviewers", label: "For reviewers" },
  { id: "record", label: "What a record holds" },
  { id: "planned", label: "Planned" },
  { id: "faq", label: "FAQ" },
];

const CONTRIB = [
  { t: "Build your hub", p: "Add public repositories by owner/name or link. The list stays in your browser; the numbers come from GitHub when you look.", s: "Live" },
  { t: "Follow the work", p: "Commit Explorer, Pull Request Workspace and Open-Source Tasks merge the activity of the repositories you follow.", s: "Live" },
  { t: "Check a reference", p: "Pick a commit or pull request you worked on. The site reads it from GitHub so the record points at something real.", s: "Live" },
  { t: "Record your part", p: `Sign one transaction on ${CHAIN.name}: repository, reference, role and the hash of an optional note. Practice mode until the record book is deployed.`, s: "Live" },
];

const REVIEW = [
  { t: "Open the record", p: "Every record links to the exact commit or pull request on GitHub. Read the change before anything else.", s: "Live" },
  { t: "Co-sign as reviewer", p: "Sign a review transaction from your own wallet. The contract refuses the author's wallet and counts each reviewer once.", s: "Live" },
  { t: "Let others verify", p: "Anyone can recompute the hashes on the verify page and see which wallets reviewed what.", s: "Live" },
];

const PLANNED = [
  { t: "Connect your repositories", p: "Link repositories you own or are allowed to read, with your permission, for private dashboards." },
  { t: "Developer API", p: "Contribution data per repository, wallet and reviewer, with webhooks and exports." },
  { t: `${BRAND.symbol} credits and premium workspace`, p: "Token-paid API credits, larger hubs and reference verification services." },
];

function Step({ n, t, p, s }: { n: number; t: string; p: string; s: string }) {
  return (
    <div className="cm-flow-step">
      <span className="n">{String(n).padStart(2, "0")}</span>
      <div>
        <h3>{t}</h3>
        <p>{p}</p>
      </div>
      <span className={`cm-tag ${s === "Live" ? "live" : "planned"}`}>{s}</span>
    </div>
  );
}

export default function HowPage() {
  const items = faq();
  return (
    <>
      <JsonLd data={faqLd(items)} />
      <SiteHeader />
      <main id="main" className="cm-wrap">
        <PageHead eyebrow="How it works" title="From repository to record." lead={`${BRAND.name} connects the people who write and review open-source code with a public, checkable trail of what they did. Here is what works today and what is still a plan.`} />
        <div className="cm-doc">
          <Toc items={TOC} />
          <div className="cm-prose">
            <h2 id="overview">Overview</h2>
            <p>
              Open source runs on work that is easy to lose sight of: a fix in a busy repository, a careful review, a newcomer&apos;s first pull request. {BRAND.name} gives that work one place to be followed and one public way to be recorded. GitHub stays the source of truth for the code; {CHAIN.name} keeps a small, permanent record that points at it, signed by the person who did the work and, when someone checks it, by a reviewer.
            </p>
            <h2 id="contributors">For contributors</h2>
            <div className="cm-flow">
              {CONTRIB.map((s, i) => (
                <Step key={s.t} n={i + 1} {...s} />
              ))}
            </div>
            <h2 id="reviewers">For reviewers</h2>
            <div className="cm-flow">
              {REVIEW.map((s, i) => (
                <Step key={s.t} n={i + 1} {...s} />
              ))}
            </div>
            <h2 id="record">What a record holds</h2>
            <div className="cm-tablewrap">
              <table>
                <tbody>
                  {[
                    ["repo", "lower-case owner/name of the GitHub repository"],
                    ["ref", "full 40-character commit SHA, or the pull request number"],
                    ["kind", "1 commit · 2 pull request"],
                    ["role", "author, co-author, reviewer, maintainer, tester or documentation"],
                    ["noteHash", "keccak-256 of your optional note; the note itself never leaves your browser"],
                    ["author, block, time", "set by the chain when you sign"],
                    ["reviews", "wallets other than the author that co-signed, with block and time"],
                  ].map((r) => (
                    <tr key={r[0]}>
                      <td>{r[0]}</td>
                      <td className="font-sans text-[13px] text-[#bdbdbd]">{r[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 id="planned">Planned</h2>
            <div className="cm-flow">
              {PLANNED.map((s, i) => (
                <Step key={s.t} n={i + 1} t={s.t} p={s.p} s="Planned" />
              ))}
            </div>
            <p className="mt-6">
              <Link href="/record">Record a contribution →</Link>
            </p>
            <h2 id="faq">FAQ</h2>
            {items.map((f) => (
              <div key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
            <div className="h-24" />
          </div>
        </div>
      </main>
      <SiteFooter active="/how-it-works" />
    </>
  );
}
