import { BRAND } from "@/config/brand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageHead } from "@/components/site/PageHead";
import { TasksWorkspace } from "@/components/workspaces/Aggregate";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/tasks",
  title: `Open-Source Tasks | ${BRAND.name}`,
  description: `${BRAND.name} Open-Source Tasks: issues marked good first issue or help wanted across the GitHub repositories in your hub.`,
});

export default function TasksPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap pb-24">
        <PageHead back={{ href: "/workspaces", label: "Workspaces" }} eyebrow="Open-Source Tasks" title="Where a hand is wanted." lead="Issues the maintainers labelled good first issue or help wanted, gathered from your hub. Read the issue and the project guidelines on GitHub before you start; the label is theirs, the decision to merge too." />
        <TasksWorkspace />
      </main>
      <SiteFooter active="/workspaces" />
    </>
  );
}
