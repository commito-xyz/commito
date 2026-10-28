import { BRAND } from "@/config/brand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageHead } from "@/components/site/PageHead";
import { CommitsWorkspace } from "@/components/workspaces/Aggregate";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/commits",
  title: `Commit Explorer | ${BRAND.name}`,
  description: `The ${BRAND.name} Commit Explorer: recent commits across the GitHub repositories in your hub, with author, date, SHA and a link to each change.`,
});

export default function CommitsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap pb-24">
        <PageHead back={{ href: "/workspaces", label: "Workspaces" }} eyebrow="Commit Explorer" title="What changed, newest first." lead="The latest commits from the repositories in your hub, merged into one timeline. Each row opens the change on GitHub; signed commits carry GitHub's verified mark." />
        <CommitsWorkspace />
      </main>
      <SiteFooter active="/workspaces" />
    </>
  );
}
