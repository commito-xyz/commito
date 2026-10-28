import { BRAND } from "@/config/brand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageHead } from "@/components/site/PageHead";
import { ContributorBoard } from "@/components/people/Contributors";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/contributors",
  title: `Contributor Dashboard | ${BRAND.name}`,
  description: `The ${BRAND.name} Contributor Dashboard: the people who commit to the repositories in your hub, merged across projects from GitHub's own contributor lists.`,
});

export default function ContributorsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap pb-24">
        <PageHead eyebrow="Contributor Dashboard" title="Who builds what you follow." lead="Contributor lists from every repository in your hub, merged by GitHub login. People who work across several of your projects come first. Counts are commits on each default branch, as GitHub reports them." />
        <ContributorBoard />
      </main>
      <SiteFooter active="/contributors" />
    </>
  );
}
