"use client";

import Link from "next/link";
import { useState } from "react";
import { BRAND, TOKEN, isAddress, shortAddress } from "@/config/brand";
import { CheckIcon, CopyIcon } from "@/components/site/Icons";

/* Copy CA: one component family, one source (BRAND.ca). Before launch it says "At launch" and copies nothing. */

export function useCopy(value: string) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard refused; the text stays visible.
    }
  };
  return { copied, copy };
}

/** Navbar chip: "$COMMITO 0x12…abcd" copies once the CA is real; before that it opens the token page ("at launch"). */
export function CaPill({ className = "" }: { className?: string }) {
  const { copied, copy } = useCopy(BRAND.ca);
  if (!TOKEN.isLive)
    return (
      <Link href="/token" className={`cm-token ${className}`} data-testid="ca-pill" title="The contract address is published at launch">
        {BRAND.symbol} <span className="font-normal opacity-70">· at launch</span>
      </Link>
    );
  return (
    <button type="button" className={`cm-token ${className}`} onClick={copy} data-testid="ca-pill" title={`Copy the ${BRAND.symbol} contract address`}>
      {BRAND.symbol} <span className="font-normal opacity-80">{shortAddress(BRAND.ca, 4, 4)}</span>
      {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
    </button>
  );
}

/** "CA 0x… [Copy]" row: hero, footer and token page. */
export function CaRow({ testid = "ca-row", label = "CA" }: { testid?: string; label?: string }) {
  const { copied, copy } = useCopy(BRAND.ca);
  const live = TOKEN.isLive;
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-3" data-testid={testid}>
      <span className="text-lime">{label}</span>
      <code className="min-w-0" style={{ overflowWrap: "anywhere" }}>
        {live ? BRAND.ca : `${BRAND.symbol} contract address · at launch`}
      </code>
      <button type="button" className="cm-copy inline-flex items-center gap-1" onClick={copy} disabled={!live} data-testid={`${testid}-copy`} title={live ? "Copy the contract address" : "Published at launch"}>
        {live ? copied ? <><CheckIcon size={12} /> Copied</> : "Copy" : "At launch"}
      </button>
    </span>
  );
}

/** Any address or hash as a copy chip. Empty value => `empty` text. */
export function AddressChip({ value, empty = "Not deployed yet", head = 6, tail = 4 }: { value: string; empty?: string; head?: number; tail?: number }) {
  const { copied, copy } = useCopy(value);
  const ok = isAddress(value) || /^0x[0-9a-fA-F]{64}$/.test(value);
  return (
    <button type="button" className="cm-code" onClick={copy} disabled={!ok} title={ok ? "Copy" : empty}>
      {ok ? shortAddress(value, head, tail) : empty}
      {ok ? copied ? <CheckIcon size={12} /> : <CopyIcon size={12} /> : null}
    </button>
  );
}
