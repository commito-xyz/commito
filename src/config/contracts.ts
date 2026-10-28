import { isAddress } from "@/config/brand";

/*
 * Commito contract address on Robinhood Chain.
 *   book  CommitoRecordBook, no constructor arguments, no owner, does not need the $COMMITO token.
 *         Not deployed yet: the owner deploys it from the local-only /deploy page.
 * Empty => recording and reviewing run in practice mode (signed with your wallet, kept in this browser, nothing sent).
 * Filled => the same buttons send real transactions from the visitor's wallet and every record page reads the chain.
 * Check a deployment any time: `npm run verify-deployment -- --book <address> --book-tx <tx>`.
 */
const DEPLOYED = {
  book: "0xb269617194ef8b934f183f5435b06330b19346b1",
  /** Block of the CommitoRecordBook deployment (first block worth reading its events from). */
  bookBlock: 100091937,
};

/**
 * Local fork tests only: NEXT_PUBLIC_COMMITO_TEST_CONTRACTS='{"book":"0x…","bookBlock":1}' at build time points a
 * second build at a contract deployed on an anvil chain. Never set it on Vercel.
 */
function testOverride(): typeof DEPLOYED | null {
  const raw = process.env.NEXT_PUBLIC_COMMITO_TEST_CONTRACTS;
  if (!raw) return null;
  try {
    const v = { ...DEPLOYED, ...(JSON.parse(raw) as Partial<typeof DEPLOYED>) };
    return isAddress(v.book) ? v : null;
  } catch {
    return null;
  }
}

export const CONTRACTS = testOverride() ?? DEPLOYED;

export const bookLive = () => isAddress(CONTRACTS.book);

export const CONTRACT_NAMES = { book: "CommitoRecordBook" } as const;
