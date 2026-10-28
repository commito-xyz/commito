/*
 * The starter hub: well-known public repositories shown before a visitor adds their own. They are examples to
 * explore the tools with, picked by the Commito team; none of them is affiliated with Commito or endorses it.
 * Live numbers (stars, forks, pushes) always come from GitHub at view time.
 */
export type SeedRepo = { owner: string; name: string; area: string };

export const SEED_REPOS: SeedRepo[] = [
  { owner: "foundry-rs", name: "foundry", area: "Smart contract tooling" },
  { owner: "wevm", name: "viem", area: "Chain client" },
  { owner: "OffchainLabs", name: "nitro", area: "Rollup node" },
  { owner: "ethereum", name: "go-ethereum", area: "Execution client" },
  { owner: "vercel", name: "next.js", area: "Web framework" },
  { owner: "tailwindlabs", name: "tailwindcss", area: "Styling" },
  { owner: "OpenZeppelin", name: "openzeppelin-contracts", area: "Contract library" },
  { owner: "denoland", name: "deno", area: "Runtime" },
  { owner: "sveltejs", name: "svelte", area: "UI compiler" },
];

/** Areas for repositories a visitor adds: derived from the language GitHub reports. */
export function areaFor(language: string, fallback = "Repository") {
  return language ? `${language} project` : fallback;
}
