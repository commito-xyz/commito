import { Suspense } from "react";
import { BRAND } from "@/config/brand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageHead } from "@/components/site/PageHead";
import { Verify } from "@/components/records/Verify";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/verify",
  title: `Verify a record | ${BRAND.name}`,
  description: `Verify a ${BRAND.name} contribution record: recompute its hashes from the repository and commit SHA in your browser and compare them with Robinhood Chain.`,
});

export default function VerifyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap pb-24">
        <PageHead back={{ href: "/records", label: "Records" }} eyebrow="Verify" title="Recompute it yourself." lead="Read a record from the chain, type the repository and the SHA or PR number, and compare the hashes in your own browser. Then open the work on GitHub and judge it." />
        <Suspense fallback={<div className="cm-panel cm-empty">Loading…</div>}>
          <Verify />
        </Suspense>
      </main>
      <SiteFooter active="/verify" />
    </>
  );
}
