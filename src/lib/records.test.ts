import { test } from "node:test";
import assert from "node:assert/strict";
import { keccak256, stringToBytes } from "viem";
import { compareRecord, noteHash, refHash, repoHash, validRef, validRepoKey, ZERO_HASH } from "./records";

test("repository rule mirrors the contract", () => {
  assert.equal(validRepoKey("vercel/next.js"), true);
  assert.equal(validRepoKey("a-b_c.d/.github"), true);
  assert.equal(validRepoKey("Vercel/next.js"), false);
  assert.equal(validRepoKey("a/b/c"), false);
  assert.equal(validRepoKey("owner/.."), false);
  assert.equal(validRepoKey(`${"a".repeat(40)}/x`), false);
  assert.equal(validRepoKey(`${"a".repeat(39)}/${"b".repeat(100)}`), true);
  assert.equal(validRepoKey(`${"a".repeat(39)}/${"b".repeat(101)}`), false);
});

test("reference rule mirrors the contract", () => {
  assert.equal(validRef(1, "0123456789abcdef0123456789abcdef01234567"), true);
  assert.equal(validRef(1, "0123456789ABCDEF0123456789abcdef01234567"), false);
  assert.equal(validRef(1, "42"), false);
  assert.equal(validRef(2, "42"), true);
  assert.equal(validRef(2, "042"), false);
  assert.equal(validRef(2, "12345678901"), false);
  assert.equal(validRef(3, "42"), false);
});

test("hashes are keccak-256 of the exact text and compareRecord spots a mismatch", () => {
  assert.equal(repoHash("a/b"), keccak256(stringToBytes("a/b")));
  assert.equal(refHash("42"), keccak256(stringToBytes("42")));
  assert.equal(noteHash("   "), ZERO_HASH);
  assert.equal(noteHash(" hi "), keccak256(stringToBytes("hi")));
  const rec = { repo: "a/b", ref: "42", repoHash: repoHash("a/b"), refHash: refHash("42") };
  assert.deepEqual(
    { ...compareRecord(rec, "a/b", "42"), repoHash: 0, refHash: 0 },
    { repoMatches: true, refMatches: true, storedRepoHashes: true, storedRefHashes: true, repoHash: 0, refHash: 0 },
  );
  assert.equal(compareRecord(rec, "a/c", "42").repoMatches, false);
  assert.equal(compareRecord(rec, "a/b", "43").refMatches, false);
});
