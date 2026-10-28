import Link from "next/link";
import { BRAND, CHAIN } from "@/config/brand";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CaRow } from "@/components/site/CaCopy";
import { ArrowRight, CommitIcon, IssueIcon, PullIcon } from "@/components/site/Icons";
import { AsciiMark } from "@/components/home/AsciiMark";
import { HomeStats, LiveBadge } from "@/components/home/Live";
import { ContributorPreview, StarterGrid } from "@/components/home/Starter";
import { Terminal } from "@/components/home/Terminal";
import { appLd } from "@/lib/seo";

const MARQUEE = ["Repository Hub", "Commit Explorer", "Pull Request Workspace", "Contributor Dashboard", "Open-Source Tasks", "Contribution Records", "Second-wallet review", "Hash verify", "Developer API · planned", CHAIN.name];

const WORKSPACES = [
  {
    href: "/commits",
    icon: <CommitIcon size={20} />,
    name: "Commits",
    meta: "recent history",
    blurb: "The latest commits across every repository in your hub, newest first, with author, date, SHA and a link to the diff on GitHub.",
  },
  {
    href: "/pulls",
    icon: <PullIcon size={20} />,
    name: "Pull requests",
    meta: "open, merged, closed",
    blurb: "Every recent pull request in your hub with its state, and on request the review trail: who approved, who asked for changes.",
  },
  {
    href: "/tasks",
    icon: <IssueIcon size={20} />,
    name: "Open tasks",
    meta: "good first issue · help wanted",
    blurb: "Issues the maintainers themselves marked as a good first issue or as needing help, gathered from the repositories you follow.",
  },
];

const STEPS = [
  {
    n: "01",
    t: "Follow",
    p: "Add any public GitHub repository by its owner/name. Stars, forks, open issues, languages and the last push are read live from GitHub, nothing to install.",
    mark: "++",
  },
  {
    n: "02",
    t: "Review",
    p: "Read the commit history, follow pull requests through review, see who contributes and pick up issues that are waiting for a helping hand.",
    mark: "<>",
  },
  {
    n: "03",
    t: "Record",
    p: "Anchor a reference to work you did on Robinhood Chain: repository, commit SHA or PR number, your role. A second wallet can co-sign it as reviewer.",
    mark: "#=",
  },
];

export default function Home() {
  return (
    <>
      <JsonLd data={appLd} />
      <SiteHeader />
      <main id="main">
        <section className="cm-hero">
          <div className="cm-wrap">
            <LiveBadge />
            <div className="cm-art">
              <AsciiMark label={`${BRAND.name} mark: a C built from square pixels, like a contribution graph`} />
            </div>
            <h1 className="cm-h1">
              {BRAND.slogan.replace(/\.$/, "")}
              <span className="cm-cursor">_</span>
            </h1>
            <p className="cm-sub">
              <strong className="font-medium text-[#f2f2f2]">{BRAND.name}</strong> puts the repositories you follow in one view and lets you sign a reviewed record of your part on {CHAIN.name}.
            </p>
            <div className="cm-ctas">
              <Link href="/explore" className="cm-btn lime">
                Open the hub <ArrowRight size={15} className="go" />
              </Link>
              <Link href="/record" className="cm-btn">
                Record a contribution
              </Link>
            </div>
            <div className="cm-cabox">
              <CaRow testid="hero-ca" />
            </div>
          </div>
        </section>

        <div className="cm-marquee" aria-hidden="true">
          <div className="cm-marquee-track">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i}>
                <b>/</b> &nbsp; {m}
              </span>
            ))}
          </div>
        </div>

        <div className="cm-wrap">
          <HomeStats />
        </div>

        <section className="cm-section">
          <div className="cm-wrap">
            <div className="cm-head cm-reveal">
              <div>
                <p className="cm-eyebrow">Starter hub</p>
                <h2 className="cm-h2">Repositories worth following.</h2>
                <p className="cm-lead">A few well-known public projects to try the tools on. Add your own in the hub; the numbers are read from GitHub every time you look.</p>
              </div>
              <Link href="/explore" className="cm-btn sm">
                Open the hub <ArrowRight size={14} className="go" />
              </Link>
            </div>
            <StarterGrid />
          </div>
        </section>

        <section className="cm-section pt-0">
          <div className="cm-wrap">
            <div className="cm-head cm-reveal">
              <div>
                <p className="cm-eyebrow">Workspaces</p>
                <h2 className="cm-h2">Commits, reviews, tasks.</h2>
                <p className="cm-lead">Three views over the repositories in your hub, so you can see what changed, what is waiting for review and where help is wanted without opening ten tabs.</p>
              </div>
              <Link href="/workspaces" className="cm-btn sm">
                All workspaces <ArrowRight size={14} className="go" />
              </Link>
            </div>
            <div className="cm-grid3">
              {WORKSPACES.map((w) => (
                <Link key={w.href} href={w.href} className="cm-card" style={{ padding: 24, gap: 16 }}>
                  <div className="cm-card-top" style={{ gap: 14 }}>
                    <span className="cm-glyph">{w.icon}</span>
                    <div>
                      <div className="cm-name">{w.name}</div>
                      <div className="cm-card-cat">{w.meta}</div>
                    </div>
                  </div>
                  <p className="cm-blurb">{w.blurb}</p>
                  <div className="cm-avatars justify-between">
                    <span className="font-mono text-[12px] text-muted">across your hub</span>
                    <span className="lime inline-flex items-center gap-1.5 font-mono text-[13px]">
                      Open <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="cm-section pt-0">
          <div className="cm-wrap">
            <div className="cm-head cm-reveal">
              <div>
                <p className="cm-eyebrow">Contributors</p>
                <h2 className="cm-h2">The people behind the code.</h2>
                <p className="cm-lead">Contributor lists come straight from each repository on GitHub. Open a profile to see what someone ships and where their commits land.</p>
              </div>
              <Link href="/contributors" className="cm-btn sm">
                All contributors <ArrowRight size={14} className="go" />
              </Link>
            </div>
            <ContributorPreview />
          </div>
        </section>

        <section className="cm-section pt-0">
          <div className="cm-wrap">
            <div className="cm-reveal">
              <p className="cm-eyebrow">How it works</p>
              <h2 className="cm-h2">Follow. Review. Record.</h2>
              <p className="cm-lead">Stars tell you what is popular. {BRAND.name} helps you see the work itself, and lets the people who did it, and the people who checked it, say so in public.</p>
            </div>
            <div className="cm-steps mt-10">
              {STEPS.map((s) => (
                <div key={s.n} className="cm-step">
                  <span className="cm-step-n">{s.n}</span>
                  <h3>{s.t}</h3>
                  <p>{s.p}</p>
                  <span className="cm-step-mark" aria-hidden="true">
                    {s.mark}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cm-section pt-0">
          <div className="cm-wrap cm-split">
            <div className="cm-reveal">
              <p className="cm-eyebrow">For developers</p>
              <h2 className="cm-h2">Records you can check without asking us.</h2>
              <p className="cm-lead">Every record lives in a small public contract with no owner. Read it with any chain client, recompute the hashes from the repository and the SHA, and open the commit on GitHub to judge the work yourself.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/developers" className="cm-btn lime">
                  Developer notes <ArrowRight size={15} className="go" />
                </Link>
                <Link href="/llms.txt" prefetch={false} className="cm-btn">
                  llms.txt
                </Link>
              </div>
            </div>
            <Terminal />
          </div>
        </section>

        <section className="cm-section pt-0">
          <div className="cm-wrap">
            <div className="cm-band cm-reveal">
              <p className="cm-eyebrow">For maintainers and reviewers</p>
              <h2 className="cm-h2">Reviews are work too. Put your name to them.</h2>
              <p className="cm-lead">When you check someone&apos;s pull request, co-sign their record with your own wallet. Anyone can then see which wallet reviewed it and when. No fee, no token needed, only network gas.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/records" className="cm-btn lime">
                  Review a record <ArrowRight size={15} className="go" />
                </Link>
                <Link href="/whitepaper" className="cm-btn">
                  Read the whitepaper
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter active="/" />
    </>
  );
}
