import Link from "next/link";
import { BRAND, CHAIN, TOKEN } from "@/config/brand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CaRow } from "@/components/site/CaCopy";
import { ASSETS } from "@/config/assets";
import { TokenFacts } from "@/components/token/TokenFacts";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/token",
  title: `${BRAND.name} (${BRAND.symbol}) Token`,
  description: `${BRAND.symbol} is the ${BRAND.name} community token on ${CHAIN.name}. Contract address, live supply and the uses that are planned, stated plainly with no promises.`,
});

const PLANNED = [
  { t: "Developer API credits", p: "Pay for heavy reads of contribution data through the planned Developer API. The free reads on this site stay free." },
  { t: "Premium workspace", p: "Larger hubs, saved team views and exports for maintainers who track many repositories. Planned, not built." },
  { t: "Reference verification services", p: "Paid checks that tie a wallet to a GitHub account with the account owner's consent. Planned; no partner exists yet." },
];

export default function TokenPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap pb-24">
        <div className="cm-center-head">
          <div className="cm-art" style={{ margin: "0 auto 30px" }}>
            <img src={ASSETS.wordmark} alt={`${BRAND.name} word mark`} width={1120} height={231} className="cm-wordmark" />
          </div>
          <h1 className="cm-big">
            {BRAND.symbol}
            <span className="cm-cursor">_</span>
          </h1>
          <p className="cm-sub">
            The community token of {BRAND.name} on {CHAIN.name}. Today it is a memecoin with no utility switched on; the uses below are plans for the parts of {BRAND.name} that would need paying for.
          </p>
        </div>
        <div className="cm-panel mx-auto mb-4 max-w-[760px] text-center">
          <p className="cm-eyebrow">Contract address · {CHAIN.name}</p>
          <div className="mt-3 flex justify-center font-mono text-[15px]">
            <CaRow testid="token-ca" label="CA" />
          </div>
          {!TOKEN.isLive ? <p className="cm-help">Contract address coming soon. It will be published on this page and on {BRAND.xHandle} only.</p> : null}
        </div>
        <TokenFacts />
        <div className="cm-panel mt-4">
          <p className="cm-eyebrow">Utility</p>
          <h3 className="mt-2">What {BRAND.symbol} could be for</h3>
          <div className="mt-5 grid gap-x-7 gap-y-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {PLANNED.map((x) => (
              <div key={x.t}>
                <div className="flex items-center gap-2 font-mono text-[14px]">
                  {x.t} <span className="cm-tag planned">planned</span>
                </div>
                <p className="cm-help">{x.p}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="cm-two">
          <div className="cm-panel">
            <h3>What does not depend on the token</h3>
            <ul className="cm-help mt-2 list-disc pl-5 text-[14px] leading-7">
              <li>Following repositories, the workspaces and the contributor dashboard are free and need no wallet.</li>
              <li>Recording and reviewing contributions costs only network gas. You never need {BRAND.symbol} to record, review or verify.</li>
              <li>Holding {BRAND.symbol} changes nothing about how records are shown or ranked.</li>
            </ul>
          </div>
          <div className="cm-panel">
            <h3>Before you buy</h3>
            <ul className="cm-help mt-2 list-disc pl-5 text-[14px] leading-7">
              <li>Trust one address: the one shown here and posted by {BRAND.xHandle}. Compare it before every trade.</li>
              <li>Repositories and people shown on {BRAND.name} have no tie to {BRAND.symbol} and do not back it.</li>
              <li>
                {BRAND.symbol} is a community memecoin with no promised value, no returns and no share of revenue. Memecoin prices swing hard; never put in money you need. <Link className="lime" href="/whitepaper#risks">Risks</Link>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <SiteFooter active="/token" />
    </>
  );
}
