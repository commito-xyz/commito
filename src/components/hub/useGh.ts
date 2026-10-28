"use client";

import { useEffect, useState } from "react";
import { ghGet, ghWords } from "@/lib/gh-client";
import type { GhQuery } from "@/lib/github";

export type Loaded<T> = { data: T | null; error: string | null; loading: boolean };

/** Loads one GitHub answer; `q` null means "nothing to load yet". */
export function useGh<T>(q: GhQuery | null): Loaded<T> {
  const key = q ? JSON.stringify(q) : "";
  const [state, setState] = useState<{ key: string; data: T | null; error: string | null }>({ key: "", data: null, error: null });
  useEffect(() => {
    if (!key) return;
    let live = true;
    ghGet<T>(JSON.parse(key) as GhQuery)
      .then((data) => live && setState({ key, data, error: null }))
      .catch((e) => live && setState({ key, data: null, error: ghWords(e) }));
    return () => {
      live = false;
    };
  }, [key]);
  if (!key) return { data: null, error: null, loading: false };
  if (state.key !== key) return { data: null, error: null, loading: true };
  return { data: state.data, error: state.error, loading: false };
}

/** Loads the same question for many repositories, a few at a time, keeping partial results. */
export function useGhMany<T>(qs: GhQuery[], parallel = 3): { rows: { q: GhQuery; data: T | null; error: string | null }[]; done: number } {
  const key = JSON.stringify(qs);
  const [state, setState] = useState<{ key: string; rows: { q: GhQuery; data: T | null; error: string | null }[]; done: number }>({ key: "", rows: [], done: 0 });
  useEffect(() => {
    let live = true;
    const list = JSON.parse(key) as GhQuery[];
    const rows = list.map((q) => ({ q, data: null as T | null, error: null as string | null }));
    let done = 0;
    let next = 0;
    const worker = async () => {
      while (live && next < list.length) {
        const i = next++;
        try {
          rows[i] = { q: list[i], data: await ghGet<T>(list[i]), error: null };
        } catch (e) {
          rows[i] = { q: list[i], data: null, error: ghWords(e) };
        }
        done++;
        if (live) setState({ key, rows: [...rows], done });
      }
    };
    for (let k = 0; k < Math.max(1, parallel); k++) void worker();
    return () => {
      live = false;
    };
  }, [key, parallel]);
  return state.key === key ? { rows: state.rows, done: state.done } : { rows: [], done: 0 };
}
