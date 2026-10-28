import { Suspense } from "react";
import { BRAND } from "@/config/brand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageHead } from "@/components/site/PageHead";
import { RecordForm } from "@/components/records/RecordForm";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/record",
  title: `Record a contribution | ${BRAND.name}`,
  description: `Record a reference to a commit or pull request you worked on with ${BRAND.name}: checked on GitHub, signed by your wallet, anchored on Robinhood Chain without any source code.`,
});

export default function RecordPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap pb-24">
        <PageHead eyebrow="Contribution Records" title="Point at the work. Sign your part." lead="Pick a repository, the commit or pull request, and your role. We check it exists on GitHub; your wallet signs a record that holds only the reference and hashes, never the code." />
        <Suspense fallback={<div className="cm-panel cm-empty">Loading the form…</div>}>
          <RecordForm />
        </Suspense>
      </main>
      <SiteFooter active="/record" />
    </>
  );
}
