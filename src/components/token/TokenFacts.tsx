"use client";

import { useChain } from "@/components/providers/ChainProvider";
import { BRAND, LAUNCHPAD, TOKEN, buyUrl, chartUrl } from "@/config/brand";
import { fmtSupply, usd } from "@/lib/format";

/** Token facts read on chain (after launch) plus public market data; before launch every slot says so. */
export function TokenFacts() {
  const { facts } = useChain();
  const live = TOKEN.isLive;
  const t = facts?.token;
  const m = facts?.market;
  const items = [
    { k: "Name / symbol", v: live ? (t?.name && t?.symbol ? `${t.name} / ${t.symbol}` : "—") : "At launch" },
    { k: "Total supply", v: live ? fmtSupply(t?.supply ?? null, t?.decimals ?? null) : "At launch" },
    { k: "Price", v: live ? usd(m?.priceUsd ?? null, 8) : "—" },
    { k: "Liquidity", v: live ? usd(m?.liquidityUsd ?? null, 0) : "—" },
  ];
  const chart = chartUrl(BRAND.ca);
  return (
    <div data-testid="token-facts">
      <div className="cm-stats mt-0">
        {items.map((i) => (
          <div key={i.k} className="cm-stat">
            <span className="cm-stat-k">{i.k}</span>
            <span className="cm-stat-v text-[22px]">{i.v}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <a href={buyUrl()} target="_blank" rel="noreferrer" className="cm-btn lime" data-testid="buy">
          {live ? `Buy on ${LAUNCHPAD.name}` : `${LAUNCHPAD.name} launchpad · at launch`}
        </a>
        {TOKEN.explorerUrl ? (
          <a href={TOKEN.explorerUrl} target="_blank" rel="noreferrer" className="cm-btn">
            Explorer
          </a>
        ) : null}
        {chart ? (
          <a href={chart} target="_blank" rel="noreferrer" className="cm-btn">
            Chart on DEXTools
          </a>
        ) : null}
      </div>
    </div>
  );
}
