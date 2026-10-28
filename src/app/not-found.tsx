import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ArrowRight } from "@/components/site/Icons";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap grid min-h-[60vh] place-items-center py-20 text-center">
        <div>
          <p className="cm-eyebrow">404</p>
          <h1 className="cm-title">
            fatal: not a page<span className="cm-cursor">_</span>
          </h1>
          <p className="cm-lead mx-auto">Nothing lives at this path. The repository you want may still be one click away in the hub.</p>
          <Link href="/explore" className="cm-btn lime mt-8">
            Open the hub <ArrowRight size={15} className="go" />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
