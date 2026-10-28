import { parseAbi } from "viem";

/*
 * ABIs the site needs. BOOK_ABI mirrors contracts/src/CommitoRecordBook.sol (src/lib/abi.test.ts checks it against
 * the compiled artifact so the two cannot drift apart).
 */
export const ERC20_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
]);

export const FEED_ABI = parseAbi([
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
]);

export const BOOK_ABI = parseAbi([
  "struct RecordView { uint256 id; address author; uint8 kind; uint8 role; uint32 reviewCount; uint64 recordedBlock; uint64 recordedAt; bytes32 repoHash; bytes32 refHash; bytes32 noteHash; string repo; string ref; }",
  "struct Review { address reviewer; uint64 reviewedBlock; uint64 reviewedAt; }",
  "function KIND_COMMIT() view returns (uint8)",
  "function KIND_PULL() view returns (uint8)",
  "function MAX_ROLE() view returns (uint8)",
  "function MAX_REPO_LENGTH() view returns (uint256)",
  "function MAX_PAGE() view returns (uint256)",
  "function totalReviews() view returns (uint256)",
  "function authorCount() view returns (uint256)",
  "function record(string repo, string ref, uint8 kind, uint8 role, bytes32 noteHash) returns (uint256 id)",
  "function review(uint256 id)",
  "function recordCount() view returns (uint256)",
  "function getRecord(uint256 id) view returns (RecordView v)",
  "function records(uint256 fromId, uint256 limit) view returns (RecordView[] out)",
  "function countByAuthor(address author) view returns (uint256)",
  "function idsByAuthor(address author, uint256 offset, uint256 limit) view returns (uint256[])",
  "function countForRepo(bytes32 repoHash) view returns (uint256)",
  "function idsForRepo(bytes32 repoHash, uint256 offset, uint256 limit) view returns (uint256[])",
  "function idOf(address author, bytes32 repoHash, bytes32 refHash, uint8 kind) view returns (uint256)",
  "function hasReviewed(uint256 id, address reviewer) view returns (bool)",
  "function reviewsOf(uint256 id, uint256 offset, uint256 limit) view returns (Review[] out)",
  "function chainBlock() view returns (uint64)",
  "event Recorded(uint256 indexed id, address indexed author, bytes32 indexed repoHash, bytes32 refHash, uint8 kind, uint8 role, bytes32 noteHash, string repo, string ref, uint64 chainBlock)",
  "event Reviewed(uint256 indexed id, address indexed reviewer, address indexed author, uint32 reviewCount, uint64 chainBlock)",
  "error BadRepo()",
  "error BadRef()",
  "error BadKind(uint8 kind)",
  "error BadRole(uint8 role)",
  "error AlreadyRecorded(uint256 id)",
  "error UnknownRecord(uint256 id)",
  "error SelfReview()",
  "error AlreadyReviewed(uint256 id)",
]);

export const ALL_ERRORS = BOOK_ABI.filter((x) => x.type === "error");

/** Plain words for each custom error, shown instead of a selector. */
export const ERROR_WORDS: Record<string, string> = {
  BadRepo: "The repository must be a lower-case owner/name path from GitHub.",
  BadRef: "A commit needs its full 40-character SHA; a pull request needs its number.",
  BadKind: "A record points at a commit or at a pull request.",
  BadRole: "Pick one of the listed roles.",
  AlreadyRecorded: "This wallet already recorded that exact commit or pull request.",
  UnknownRecord: "There is no record with that number yet.",
  SelfReview: "A record cannot be reviewed by the wallet that made it. Ask a second wallet to co-sign.",
  AlreadyReviewed: "This wallet already co-signed that record.",
};
