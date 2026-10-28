"use client";

import { useCallback, useMemo } from "react";
import { storageKey } from "@/config/storage";
import { useLocalStore } from "@/components/wallet/useLocalStore";
import { SEED_REPOS } from "@/content/seed";
import { parseRepo, repoKey, type RepoRef } from "@/lib/github";

/*
 * The visitor's Repository Hub: a list of public repositories kept in this browser only (localStorage).
 * A browser that never saved a hub starts with the starter set; clearing the hub keeps it empty.
 */

export type HubEntry = RepoRef & { addedAt: number };
export const MAX_HUB = 40;

const seed = (): HubEntry[] => SEED_REPOS.map((r, i) => ({ owner: r.owner, name: r.name, addedAt: i }));

export function useHub() {
  const [saved, setSaved] = useLocalStore<HubEntry[] | null>(storageKey("hub"), null);
  const list = useMemo(() => (Array.isArray(saved) ? saved.filter((r) => parseRepo(`${r?.owner}/${r?.name}`)) : seed()), [saved]);
  const has = useCallback((r: RepoRef) => list.some((x) => repoKey(x) === repoKey(r)), [list]);
  const add = useCallback(
    (r: RepoRef): "added" | "exists" | "full" => {
      if (list.some((x) => repoKey(x) === repoKey(r))) return "exists";
      if (list.length >= MAX_HUB) return "full";
      setSaved([{ owner: r.owner, name: r.name, addedAt: Date.now() }, ...list]);
      return "added";
    },
    [list, setSaved],
  );
  const remove = useCallback((r: RepoRef) => setSaved(list.filter((x) => repoKey(x) !== repoKey(r))), [list, setSaved]);
  const reset = useCallback(() => setSaved(null), [setSaved]);
  const clear = useCallback(() => setSaved([]), [setSaved]);
  return { list, has, add, remove, reset, clear, isSeed: !Array.isArray(saved) };
}
