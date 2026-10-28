import { test } from "node:test";
import assert from "node:assert/strict";
import { pulse } from "./pulse";
import { kfmt, isoAgo } from "./format";

const now = Date.parse("2026-10-28T00:00:00Z");

test("pulse: fresh and popular is high, stale and small is low, archived is zero", () => {
  const fresh = pulse({ pushedAt: "2026-10-27T23:00:00Z", stars: 120_000, forks: 20_000 }, now);
  const stale = pulse({ pushedAt: "2024-01-01T00:00:00Z", stars: 3, forks: 0 }, now);
  assert.ok(fresh >= 90 && fresh <= 99, String(fresh));
  assert.ok(stale <= 5, String(stale));
  assert.equal(pulse({ pushedAt: "2026-10-27T23:00:00Z", stars: 9, forks: 1, archived: true }, now), 0);
});

test("pulse: recency halves every 30 days", () => {
  const a = pulse({ pushedAt: "2026-10-28T00:00:00Z", stars: 0, forks: 0 }, now);
  const b = pulse({ pushedAt: "2026-09-28T00:00:00Z", stars: 0, forks: 0 }, now);
  assert.equal(a, 50);
  assert.equal(b, 25);
  assert.equal(pulse({ pushedAt: "nonsense", stars: 0, forks: 0 }, now), 0);
});

test("kfmt and isoAgo", () => {
  assert.equal(kfmt(396_000), "396k");
  assert.equal(kfmt(48_812), "48.8k");
  assert.equal(kfmt(564), "564");
  assert.equal(kfmt(12_400_000), "12M");
  assert.equal(isoAgo("", now), "—");
  assert.equal(isoAgo("2026-10-27T21:00:00Z", now), "3h ago");
});
