/** Site navigation (top bar, drawer, footer). One list each, so every place stays in step. */

/** The "Explore" menu: the working parts of the hub. */
export const EXPLORE_NAV = [
  { href: "/explore", label: "Repository Hub", blurb: "Follow public repositories and their live GitHub numbers." },
  { href: "/workspaces", label: "Workspaces", blurb: "Commits, pull requests and open tasks across your hub." },
  { href: "/contributors", label: "Contributors", blurb: "Who builds the repositories you follow." },
  { href: "/record", label: "Record work", blurb: "Anchor a commit or pull request reference on chain." },
  { href: "/records", label: "Records", blurb: "Read, review and verify contribution records." },
] as const;

export const TOP_NAV = [
  { href: "/developers", label: "For developers" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/whitepaper", label: "Whitepaper" },
] as const;

export const FOOTER_NAV = [
  { href: "/explore", label: "Hub" },
  { href: "/workspaces", label: "Workspaces" },
  { href: "/contributors", label: "Contributors" },
  { href: "/record", label: "Record" },
  { href: "/records", label: "Records" },
  { href: "/verify", label: "Verify" },
  { href: "/token", label: "TOKEN" },
  { href: "/developers", label: "For developers" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/whitepaper", label: "Whitepaper" },
  { href: "/llms.txt", label: "llms.txt" },
] as const;
