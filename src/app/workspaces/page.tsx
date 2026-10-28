import Link from "next/link";
import { BRAND } from "@/config/brand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ArrowRight, CommitIcon, IssueIcon, PullIcon } from "@/components/site/Icons";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/workspaces",
  title: `Workspaces | ${BRAND.name}`,
  description: `${BRAND.name} workspaces: a commit explorer, a pull request workspace and open-source tasks across the public repositories in your hub.`,
});

const ITEMS = [
  { href: "/commits", icon: <CommitIcon size={22} />, name: "Commit Explorer", meta: "30 latest per repo", blurb: "One timeline of the newest commits across your hub: message, author, date, short SHA and GitHub's signature mark." },
  { href: "/pulls", icon: <PullIcon size={22} />, name: "Pull Request Workspace", meta: "open · merged · closed", blurb: "Recent pull requests with their state and requested reviewers; open the review trail to count approvals and change requests." },
  { href: "/tasks", icon: <IssueIcon size={22} />, name: "Open-Source Tasks", meta: "maintainer labels", blurb: "Open issues labelled good first issue or help wanted by the maintainers, so newcomers can find a place to start." },
];

export default function WorkspacesPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap pb-24">
        <div className="cm-center-head">
          <p className="cm-eyebrow">Workspaces</p>
          <h1 className="cm-title">Three views over your hub.</h1>
          <p className="cm-lead mx-auto">Each workspace reads the repositories you follow straight from GitHub and merges them, newest first. Nothing is copied or stored on our side beyond a short cache.</p>
        </div>
        <div className="cm-grid3">
          {ITEMS.map((w) => (
            <Link key={w.href} href={w.href} className="cm-card" style={{ padding: 24, gap: 16 }}>
              <div className="cm-card-top" style={{ gap: 14 }}>
                <span className="cm-glyph">{w.icon}</span>
                <div className="min-w-0">
                  <div className="cm-name">{w.name}</div>
                  <div className="cm-card-cat">{w.meta}</div>
                </div>
              </div>
              <p className="cm-blurb">{w.blurb}</p>
              <div className="cm-avatars justify-end">
                <span className="lime inline-flex items-center gap-1.5 font-mono text-[13px]">
                  Open <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="cm-panel mt-4">
          <h3>How items get in</h3>
          <p className="cm-help mt-2 text-[14px]">
            Only repositories in your hub are read, at most eight at a time, so a visit stays inside GitHub&apos;s limit for anonymous reads (60 an hour per address; the site caches answers and falls back to your browser&apos;s own quota when its share runs out). Private repositories are never read: {BRAND.name} has no access to them and asks for none. Connecting your own repositories with permission is planned and would only read what you allow.
          </p>
        </div>
      </main>
      <SiteFooter active="/workspaces" />
    </>
  );
}
