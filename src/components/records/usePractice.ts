"use client";

import { useCallback } from "react";
import { storageKey } from "@/config/storage";
import { useLocalStore } from "@/components/wallet/useLocalStore";

/*
 * Practice records: before CommitoRecordBook is deployed, a record is signed with personal_sign and kept in this
 * browser only. Nothing is sent anywhere. Practice reviews work the same way (a second wallet signs).
 */

export type PracticeReview = { reviewer: string; at: number; signature: string };
export type PracticeRecord = {
  id: string;
  author: string;
  repo: string;
  ref: string;
  kind: number;
  role: number;
  noteHash: string;
  at: number;
  signature: string;
  reviews: PracticeReview[];
};

export const MAX_PRACTICE = 100;

export function usePractice() {
  const [list, setList] = useLocalStore<PracticeRecord[]>(storageKey("practice"), []);
  const safe = Array.isArray(list) ? list : [];
  const add = useCallback((r: PracticeRecord) => setList((prev) => [r, ...(Array.isArray(prev) ? prev : [])].slice(0, MAX_PRACTICE)), [setList]);
  const review = useCallback(
    (id: string, rv: PracticeReview) => setList((prev) => (Array.isArray(prev) ? prev : []).map((r) => (r.id === id && !r.reviews.some((x) => x.reviewer.toLowerCase() === rv.reviewer.toLowerCase()) ? { ...r, reviews: [...r.reviews, rv] } : r))),
    [setList],
  );
  const remove = useCallback((id: string) => setList((prev) => (Array.isArray(prev) ? prev : []).filter((r) => r.id !== id)), [setList]);
  return { list: safe, add, review, remove };
}
