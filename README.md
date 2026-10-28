# Commito — Repositories. Commits. Code reviews. Contribution records.

**Build Open. Ship Together.** Website: https://commito.xyz · X: https://x.com/commitoxyz

## The problem

Open-source work is spread across many repositories, and the parts that matter most are the easiest to lose:
a fix in a busy project, a careful review, a first pull request. "I contributed to X" is easy to write and slow to
check, and reviewers rarely get any visible credit for the time they put in.

## The solution

Commito gathers the repositories you follow into one workspace read live from GitHub, and adds one small public
primitive on Robinhood Chain: a contribution record that points at a real commit or pull request, signed by the
person who did the work and co-signed by a different wallet that reviewed it. Only references and hashes go on chain;
the code stays on GitHub.

## How it works

1. **Repository Hub.** Add public repositories by `owner/name` or link. The list lives in your browser
   (localStorage). Stars, forks, open issues, languages, topics, license and last push come from the GitHub REST API.
2. **Workspaces.** The Commit Explorer, the Pull Request Workspace (state + review trail on request) and
   Open-Source Tasks (`good first issue`, `help wanted`) merge the first eight repositories of your hub.
3. **Contributor Dashboard.** GitHub contributor lists merged by login, plus a profile page per person.
4. **Contribution Records.** `CommitoRecordBook.record(repo, ref, kind, role, noteHash)` stores the lower-case
   repository path, the full commit SHA or pull request number, a role and the hash of an optional note. The form
   checks the reference on GitHub first. One record per wallet per exact reference.
5. **Reviews.** `review(id)` lets any wallet except the author co-sign a record, once.
6. **Verify.** Recompute keccak-256 of the repository path and the reference in the browser and compare with the chain.

GitHub reads go through a cached server route (`/api/gh`, 5 to 60 minutes per question). When the server's anonymous
quota is used up, the browser reads GitHub directly with the visitor's own quota. Before the record book is deployed,
records and reviews run in practice mode: `personal_sign` messages kept in the browser, nothing sent.

## What you can try

Live in this build:

- Repository Hub, Commit Explorer, Pull Request Workspace, Open-Source Tasks, Contributor Dashboard and profiles.
- Contribution records and second-wallet reviews (practice mode until the contract address is set), verify page.
- Live chain data: Robinhood Chain block, gas, ETH / USD from the Chainlink feed; token facts and public market data
  once the token address is published.
- Wallet connect for Robinhood Chain (browser wallets over EIP-6963, WalletConnect when configured).

Coming later (planned, not built): connecting repositories you own with your permission, a Developer API, agent
tools, and possible `$COMMITO` uses such as API credits, a premium workspace and consented verification services.
Nothing in this repository promises rewards, earnings or returns.

## Run it locally

Requirements: Node.js 20 or newer, npm. Download the ZIP or fork the repository, then:

```sh
npm install
npm run build
npm start            # http://localhost:5800
```

No environment variables are required. Optional ones (put them in `.env.local`, never commit it):

| Variable | Use |
| --- | --- |
| `GITHUB_TOKEN` | Raises the server's GitHub read limit from 60 to 5,000 per hour. A fine-grained token with no extra permissions (public data only). |
| `ROBINHOOD_RPC_URL` | Server-side RPC for chain reads (default: public RPC) |
| `NEXT_PUBLIC_ROBINHOOD_RPC_URL` | Browser RPC (default: public RPC) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Enables the WalletConnect option (project id from cloud.reown.com) |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Shared store for rate limits across server instances |

Checks:

```sh
npm test             # GitHub input rules and shaping, record rules and hashes, Pulse, relay rules, rate limits, deployment checker
npx tsc --noEmit
npx eslint
```

Contracts (Foundry):

```sh
cd contracts
./setup.sh                                           # fetches forge-std into contracts/lib
forge test --no-match-path 'test/fork/*'             # unit, fuzz and invariant tests
forge test --match-path 'test/fork/*' --fork-url https://robinhood.drpc.org --evm-version cancun
```

Check that an address runs exactly this contract (the creation transaction is required):

```sh
npm run verify-deployment -- --book <address> --book-tx <creation tx>
```

Brand images (mark, favicon, app icons, share card) are generated and committed under `public/brand` and `src/app`;
replace a file with one of the same name to swap it.

## Network in your wallet

The connect dialog adds the network for you. By hand: Robinhood Chain, chain id `4663`, currency `ETH`,
RPC `https://rpc.mainnet.chain.robinhood.com`, explorer `https://robinhoodchain.blockscout.com`.

## Project layout

```
contracts/          CommitoRecordBook (Solidity) and its Foundry tests
scripts/            artifact export, deployment checker
src/app/            pages (home, hub, repository, workspaces, contributors, record, records, verify, token,
                    developers, how it works, whitepaper) and API routes (/api/gh, /api/chain, /api/rpc)
src/components/     site chrome, hero art, hub cards, repository view, workspaces, records, wallet dialog
src/content/        starter repositories, FAQ
src/config/         brand.ts (name, ticker, contract address, launchpad), contracts.ts (record book), assets.ts
src/lib/            GitHub rules and client, record rules and hashes, book reads and writes, Pulse, relay rules
public/             generated brand images and wallet logos
```

## Contracts and token

- `CommitoRecordBook` — contribution records and second-wallet reviews. No owner, no admin, no fee, no upgrade, no
  constructor arguments, accepts no ETH. Not deployed yet; the address will be set in `src/config/contracts.ts`.
- `$COMMITO` — contract address published at launch on the website and in `src/config/brand.ts`. Launchpad: Pons.

## Security and status

Early build. The contract has unit, fuzz and invariant tests plus a fork test against Robinhood Chain; it has not
been independently reviewed yet. A record is a claim signed by a wallet and does not prove who wrote the code; a
review is only as trustworthy as the reviewer. Records are public and permanent. Never paste a seed phrase or private
key anywhere; the site never asks for one.

## Contributing

Issues and pull requests are welcome. Keep changes small, run `npm test`, `npx tsc --noEmit`, `npx eslint` and the
Foundry tests before you open a pull request, and describe what you changed and why.

## License

MIT, see [LICENSE](LICENSE).
