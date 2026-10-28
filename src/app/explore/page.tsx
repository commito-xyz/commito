import { BRAND } from "@/config/brand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageHead } from "@/components/site/PageHead";
import { HubExplorer } from "@/components/explore/HubExplorer";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/explore",
  title: `Repository Hub | ${BRAND.name}`,
  description: `Follow public GitHub repositories in the ${BRAND.name} Repository Hub: live stars, forks, open issues, languages and last push, kept in your own browser.`,
});

export default function ExplorePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap pb-24">
        <PageHead eyebrow="Repository Hub" title="Every repo you follow, live." lead="Search your hub, filter by language, sort by what matters to you. Add any public GitHub repository by its owner/name or link; your list stays in this browser." />
        <HubExplorer />
      </main>
      <SiteFooter active="/explore" />
    </>
  );
}
