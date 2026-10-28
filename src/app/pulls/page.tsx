import { BRAND } from "@/config/brand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageHead } from "@/components/site/PageHead";
import { PullsWorkspace } from "@/components/workspaces/Aggregate";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/pulls",
  title: `Pull Request Workspace | ${BRAND.name}`,
  description: `The ${BRAND.name} Pull Request Workspace: open, merged and closed pull requests across your hub, with the review trail of each one on request.`,
});

export default function PullsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap pb-24">
        <PageHead back={{ href: "/workspaces", label: "Workspaces" }} eyebrow="Pull Request Workspace" title="Changes waiting for a decision." lead="Recent pull requests from the repositories in your hub. Filter by state, open the review trail to see approvals and change requests, or record a pull request you worked on." />
        <PullsWorkspace />
      </main>
      <SiteFooter active="/workspaces" />
    </>
  );
}
