"use client";

import { useEffect, useMemo, useState } from "react";

import { MARK_GRID } from "@/content/mark-grid";

/*
 * The hero art: the owner's Commito mark (a "C" built from square pixels, like a contribution graph), each square drawn
 * as a small block of characters that keeps re-typing itself. The grid comes from src/content/mark-grid.ts, generated
 * from the owner's artwork together with the brand images.
 */

const COLS = MARK_GRID[0]?.length ?? 0;
const ROWS = MARK_GRID.length;
const CELL = 24;
const BLOCK = 22;
const CHARS = "01{}[]<>/\\|=+-*#~:;";

function inMark(c: number, r: number) {
  return MARK_GRID[r]?.[c] === "#";
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function block(rand: () => number) {
  let out = "";
  for (let line = 0; line < 3; line++) {
    for (let k = 0; k < 4; k++) out += CHARS[Math.floor(rand() * CHARS.length)];
    if (line < 2) out += "\n";
  }
  return out;
}

export function AsciiMark({ label }: { label: string }) {
  const cells = useMemo(() => {
    const list: { c: number; r: number }[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (inMark(c, r)) list.push({ c, r });
    return list;
  }, []);
  // Deterministic first frame (same on server and client), then the client keeps re-typing blocks.
  const [frame, setFrame] = useState(() => {
    const rand = seeded(4663);
    return cells.map(() => ({ t: block(rand), hot: rand() < 0.08 }));
  });
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rand = seeded(Date.now() & 0xffff);
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setFrame((f) => {
        const next = f.slice();
        for (let k = 0; k < 6; k++) {
          const i = Math.floor(rand() * next.length);
          next[i] = { t: block(rand), hot: rand() < 0.08 };
        }
        return next;
      });
    }, 140);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="cm-ascii" role="img" aria-label={label} style={{ width: COLS * CELL, height: ROWS * CELL, fontSize: "8.1px" }}>
      {cells.map((cell, i) => (
        <i key={`${cell.c}-${cell.r}`} aria-hidden="true" className={frame[i]?.hot ? "hot" : ""} style={{ left: cell.c * CELL, top: cell.r * CELL, width: BLOCK, height: BLOCK }}>
          {frame[i]?.t}
        </i>
      ))}
    </div>
  );
}
