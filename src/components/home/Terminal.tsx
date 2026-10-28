"use client";

import { useEffect, useState } from "react";

/*
 * Typed session for the developer section. It shows how a contribution record is read with a plain chain client;
 * the values are an example, labelled as such in the bar.
 */
const LINES: { cls: string; text: string }[] = [
  { cls: "k", text: "> verify the review on record #1" },
  { cls: "", text: "" },
  { cls: "k", text: "● " },
  { cls: "", text: "book.read.getRecord([1n])" },
  { cls: "m", text: "  └ repo   ethereum/go-ethereum" },
  { cls: "m", text: "    ref    commit 4f1c…e09a · role Reviewer" },
  { cls: "m", text: "    hashes match what you typed  ✓" },
  { cls: "", text: "" },
  { cls: "k", text: "● " },
  { cls: "", text: "book.read.reviewsOf([1n, 0n, 10n])" },
  { cls: "m", text: "  └ 1 co-signature · a second wallet, not the author" },
  { cls: "", text: "" },
  { cls: "k", text: "Opening the commit on GitHub to read it yourself" },
];

export function Terminal() {
  const full = LINES.map((l) => l.text).join("\n");
  const [n, setN] = useState(full.length);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let t: number;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const tick = () => {
        i = Math.min(full.length, i + 3);
        setN(i);
        if (i < full.length) t = window.setTimeout(tick, 22);
      };
      setN(0);
      tick();
    });
    const el = document.getElementById("dev-term");
    if (el) io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [full]);
  // Character offset where each line starts in the typed text.
  const starts = LINES.map((_, i) => LINES.slice(0, i).reduce((a, l) => a + l.text.length + 1, 0));
  return (
    <div className="cm-term" id="dev-term">
      <div className="cm-term-bar">
        <i />
        <i />
        <i />
        <span className="ml-2">example · reading the record book</span>
      </div>
      <div className="cm-term-body" aria-label="Example session reading a contribution record">
        {LINES.map((l, i) => {
          const take = Math.max(0, Math.min(l.text.length, n - starts[i]));
          const nl = i < LINES.length - 1 && !LINES[i].text.startsWith("● ") ? "\n" : "";
          return (
            <span key={i} className={l.cls}>
              {l.text.slice(0, take)}
              {take === l.text.length ? nl : ""}
            </span>
          );
        })}
        <span className="cm-cursor">▌</span>
      </div>
    </div>
  );
}
