import Link from "next/link";
import { BRAND, hasGithub } from "@/config/brand";
import { ASSETS } from "@/config/assets";
import { CaRow } from "@/components/site/CaCopy";
import { FOOTER_NAV } from "@/components/site/nav";

export function SiteFooter({ active }: { active?: string }) {
  return (
    <footer className="cm-footer">
      <div className="cm-wrap">
        <div className="cm-foot-brand">
          <img src={ASSETS.mark} alt="" width={26} height={26} />
          <span>
            {BRAND.name} · {BRAND.slogan.toLowerCase()}
          </span>
        </div>
        <nav className="cm-foot-links" aria-label="Footer">
          {FOOTER_NAV.map((n) => (
            <Link key={n.href} href={n.href} className={active === n.href ? "on" : ""} prefetch={n.href.endsWith(".txt") ? false : undefined}>
              {n.label === "TOKEN" ? BRAND.symbol : n.label}
            </Link>
          ))}
          {hasGithub ? (
            <a href={BRAND.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          ) : null}
          <a href={BRAND.x} target="_blank" rel="noreferrer">
            X
          </a>
        </nav>
        <div className="cm-foot-ca">
          <CaRow testid="footer-ca" />
        </div>
        <p className="cm-foot-note">
          {BRAND.name} reads public data from GitHub and Robinhood Chain and never stores source code on chain. Contribution records are claims signed by the wallet that made them; a review is a second wallet&apos;s signature, not a guarantee of quality or of who wrote the code. {BRAND.symbol} is a community token with no promised value, income or reward, and holding it gives no claim on anything. Features marked planned do not exist yet and may change or never ship. Never put in money you need.{" "}
          <Link href="/whitepaper#risks">Read the risks</Link>.
        </p>
      </div>
    </footer>
  );
}
