import { test } from "node:test";
import assert from "node:assert/strict";
import { ghPath, parseRepo, repoKey, reviewSummary, shape } from "./github";

test("parseRepo reads paths, links and .git endings", () => {
  assert.deepEqual(parseRepo("vercel/next.js"), { owner: "vercel", name: "next.js" });
  assert.deepEqual(parseRepo("https://github.com/Foundry-RS/foundry/tree/master"), { owner: "Foundry-RS", name: "foundry" });
  assert.deepEqual(parseRepo("github.com/a/b.git"), { owner: "a", name: "b" });
  assert.equal(parseRepo("nope"), null);
  assert.equal(parseRepo("-bad/x"), null);
  assert.equal(parseRepo("a/.."), null);
  assert.equal(parseRepo("a/b c"), null);
  assert.equal(repoKey({ owner: "Foundry-RS", name: "Foundry" }), "foundry-rs/foundry");
});

test("ghPath allows only known questions with valid input", () => {
  assert.equal(ghPath({ op: "repo", owner: "a", name: "b" }), "/repos/a/b");
  assert.equal(ghPath({ op: "commit", owner: "a", name: "b", ref: "ABCDEF1" }), "/repos/a/b/commits/abcdef1");
  assert.equal(ghPath({ op: "commit", owner: "a", name: "b", ref: "../../x" }), null);
  assert.equal(ghPath({ op: "pull", owner: "a", name: "b", ref: "0" }), null);
  assert.equal(ghPath({ op: "reviews", owner: "a", name: "b", ref: "12" }), "/repos/a/b/pulls/12/reviews?per_page=50");
  assert.equal(ghPath({ op: "tasks", owner: "a", name: "b", label: "bug" }), null);
  assert.match(String(ghPath({ op: "tasks", owner: "a", name: "b", label: "help wanted" })), /labels=help%20wanted/);
  assert.equal(ghPath({ op: "user", login: "a/b" }), null);
  assert.equal(ghPath({ op: "repo", owner: "a", name: "b/../c" }), null);
});

test("shape drops unknown fields and unsafe links", () => {
  const r = shape("repo", { full_name: "a/b", name: "b", owner: { login: "a", avatar_url: "javascript:alert(1)" }, html_url: "https://evil.example/a", homepage: "javascript:alert(1)", stargazers_count: 5, extra: "x" }) as Record<string, unknown>;
  assert.equal(r.avatar, "");
  assert.equal(r.url, "");
  assert.equal(r.homepage, "");
  assert.equal(r.stars, 5);
  assert.equal("extra" in r, false);
  const tasks = shape("tasks", [{ number: 1, title: "t", pull_request: {} }, { number: 2, title: "u", labels: [{ name: "help wanted" }] }]) as { number: number }[];
  assert.deepEqual(tasks.map((t) => t.number), [2]);
  const pulls = shape("pulls", [{ number: 3, state: "closed", merged_at: "2026-01-01T00:00:00Z" }]) as { state: string }[];
  assert.equal(pulls[0].state, "merged");
});

test("reviewSummary keeps the latest decision per reviewer", () => {
  const s = reviewSummary([
    { login: "a", avatar: "", state: "CHANGES_REQUESTED", at: "" },
    { login: "a", avatar: "", state: "APPROVED", at: "" },
    { login: "b", avatar: "", state: "COMMENTED", at: "" },
    { login: "c", avatar: "", state: "CHANGES_REQUESTED", at: "" },
  ]);
  assert.deepEqual(s, { approved: 1, changes: 1, commented: 1, reviewers: 2 });
});
