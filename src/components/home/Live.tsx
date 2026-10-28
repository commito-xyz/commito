"use client";

import { useChain } from "@/components/providers/ChainProvider";
import { useHub } from "@/components/hub/useHub";
import { bookLive } from "@/config/contracts";
import { CHAIN } from "@/config/brand";
import { fmtInt, usd } from "@/lib/format";

/** Hero badge: live block height from Robinhood Chain, or a calm "connecting" while the first read is in flight. */
export function LiveBadge() {
  const { facts, failed } = useChain();
  const on = Boolean(facts?.block);
  return (
    <span className="cm-badge" data-testid="live-badge">
      <span className={`cm-live${on ? "" : " off"}`} aria-hidden="true" />
      {on ? (
        <>
          Live on {CHAIN.name} · block {fmtInt(facts!.block!)}
        </>
      ) : failed ? (
        <>Following {CHAIN.name} · chain data unavailable right now</>
      ) : (
        <>Following public repositories on {CHAIN.name}</>
      )}
    </span>
  );
}

/** The four live numbers under the hero. */
export function HomeStats() {
  const { facts } = useChain();
  const { list } = useHub();
  const items = [
    { k: "Repos in your hub", v: String(list.length), s: "kept in this browser" },
    { k: `${CHAIN.name} block`, v: facts?.block ? fmtInt(facts.block) : "—", s: facts?.blockPace ? `~${facts.blockPace.toFixed(2)} s per block` : "read live" },
    { k: "ETH / USD", v: facts?.ethUsd ? usd(facts.ethUsd) : "—", s: "Chainlink feed on chain" },
    { k: "Records on chain", v: bookLive() ? (facts?.book?.records != null ? fmtInt(facts.book.records) : "—") : "—", s: bookLive() ? `${facts?.book?.reviews ?? "—"} reviews signed` : "record book not deployed yet" },
  ];
  return (
    <div className="cm-stats" data-testid="home-stats">
      {items.map((i) => (
        <div key={i.k} className="cm-stat">
          <span className="cm-stat-k">{i.k}</span>
          <span className="cm-stat-v">{i.v}</span>
          <span className="cm-stat-s">{i.s}</span>
        </div>
      ))}
    </div>
  );
}
