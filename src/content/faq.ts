import { BRAND, CHAIN, LAUNCHPAD, TOKEN } from "@/config/brand";

/** Questions answered on /how-it-works (also emitted as FAQPage structured data, same text). */
export function faq() {
  return [
    {
      q: `What is ${BRAND.name}?`,
      a: `${BRAND.name} is an open-source workspace on ${CHAIN.name}. You follow public GitHub repositories, read their commits, pull requests, contributors and open tasks in one place, and you can anchor a reviewed record of your own contribution on chain without moving any code.`,
    },
    {
      q: `How does ${BRAND.name} work?`,
      a: `The site reads public data from the GitHub REST API and keeps your list of repositories in your browser. A contribution record is a transaction from your wallet to the CommitoRecordBook contract holding the repository path, the commit SHA or pull request number, your role and the hash of an optional note. A different wallet can co-sign it as reviewer.`,
    },
    {
      q: `Does ${BRAND.name} need access to my GitHub account?`,
      a: `No. Everything shown today is public GitHub data read without a login. ${BRAND.name} never asks for a GitHub token and never reads private repositories. Connecting repositories you own with your permission is planned.`,
    },
    {
      q: `Is any source code stored on the blockchain?`,
      a: `No. Only references (owner/name, a commit SHA or a pull request number), a role number and hashes are recorded. The code stays on GitHub.`,
    },
    {
      q: `What does "reviewed" mean on a record?`,
      a: `It means a second wallet, different from the author's, signed a review transaction for that record. It shows who vouched for the work and when. It is not a guarantee of quality and does not prove who wrote the code.`,
    },
    {
      q: `How do I buy ${BRAND.symbol}?`,
      a: TOKEN.isLive
        ? `${BRAND.symbol} trades on the ${LAUNCHPAD.name} launchpad on ${CHAIN.name}. Use the Buy button on the token page, which opens its ${LAUNCHPAD.name} page, and always check the contract address shown there.`
        : `${BRAND.symbol} has not launched yet. At launch it will be available on the ${LAUNCHPAD.name} launchpad on ${CHAIN.name}, and the official contract address will be published on the token page and on ${BRAND.xHandle}.`,
    },
    {
      q: `Which network is ${BRAND.name} on?`,
      a: `${CHAIN.name} (chain id ${CHAIN.id}), with ETH for gas. Your wallet is asked to add the network when you connect.`,
    },
    {
      q: `Do I need ${BRAND.symbol} to use ${BRAND.name}?`,
      a: `No. The hub, workspaces and records work without the token. Recording or reviewing costs only network gas. Token uses such as API credits and a premium workspace are planned, not live.`,
    },
    {
      q: `What are the risks?`,
      a: `Records are public and permanent once on chain. The contract has not been through an independent security review yet. ${BRAND.symbol} is a community memecoin with no promised value, income or reward. GitHub data can be limited by rate limits or change after you read it.`,
    },
  ];
}
