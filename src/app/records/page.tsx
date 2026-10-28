import { Suspense } from "react";
import { BRAND } from "@/config/brand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageHead } from "@/components/site/PageHead";
import { RecordList } from "@/components/records/RecordList";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/records",
  title: `Contribution records | ${BRAND.name}`,
  description: `Read ${BRAND.name} contribution records on Robinhood Chain, co-sign one as a reviewer with a second wallet, or find the records of a repository or a wallet.`,
});

export default function RecordsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap pb-24">
        <PageHead eyebrow="Records" title="Signed references, open to review." lead="Every record points at a commit or pull request on GitHub. Read the work, then co-sign the record from a different wallet: that is what reviewed means here." />
        <Suspense fallback={<div className="cm-panel cm-empty">Loading records…</div>}>
          <RecordList />
        </Suspense>
      </main>
      <SiteFooter active="/records" />
    </>
  );
}
