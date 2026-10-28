// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CommitoRecordBook
/// @notice Public book of contribution records for open-source work on GitHub. A wallet records a reference to a piece
///         of work it took part in (a commit SHA or a pull request number in a public repository), the role it played
///         and a fingerprint of an optional note. Any OTHER wallet can then co-sign the record as its reviewer, in a
///         separate transaction, so "reviewed" always means a second wallet signed.
///         The book stores references only: the repository path ("owner/name"), the commit SHA or pull request number,
///         and hashes. It never stores source code, and it cannot see GitHub: a record proves that this wallet made
///         this claim at this moment, never that the work is good or that the wallet belongs to the GitHub author.
/// @dev No owner, no admin, no fee, no pause, no upgrade path, no constructor arguments, no token. The contract never
///      holds funds: no function is payable and there is no receive or fallback, so ETH transfers revert.
///      On Arbitrum-style chains `block.number` reports the parent chain's block, so the chain's own block is read
///      from the ArbSys precompile when it answers, and from `block.number` everywhere else (local tests).
contract CommitoRecordBook {
    /// @notice Kinds of work a record can point at.
    uint8 public constant KIND_COMMIT = 1;
    uint8 public constant KIND_PULL = 2;
    /// @notice Roles 1..MAX_ROLE: 1 author, 2 co-author, 3 reviewer, 4 maintainer, 5 tester, 6 documentation.
    uint8 public constant MAX_ROLE = 6;
    /// @notice Longest repository path accepted ("owner/name", GitHub allows 39 + 1 + 100).
    uint256 public constant MAX_REPO_LENGTH = 140;
    /// @notice Most entries a paginated read returns at once.
    uint256 public constant MAX_PAGE = 100;

    /// @dev ArbSys precompile. `arbBlockNumber()` returns the chain's own block number.
    address private constant ARB_SYS = address(0x64);
    bytes4 private constant ARB_BLOCK_NUMBER = 0xa3b1b31d;
    /// @dev Gas forwarded to ArbSys. The real precompile needs about a thousand; the cap keeps a chain (or a local
    ///      fork) where 0x64 holds failing code from burning the whole transaction's gas.
    uint256 private constant ARB_SYS_GAS = 30_000;

    struct Record {
        address author;
        uint8 kind;
        uint8 role;
        uint32 reviewCount;
        uint64 recordedBlock;
        uint64 recordedAt;
        bytes32 repoHash;
        bytes32 refHash;
        bytes32 noteHash;
    }

    struct Review {
        address reviewer;
        uint64 reviewedBlock;
        uint64 reviewedAt;
    }

    /// @notice A record as the read functions return it, with its id and the plain references.
    struct RecordView {
        uint256 id;
        address author;
        uint8 kind;
        uint8 role;
        uint32 reviewCount;
        uint64 recordedBlock;
        uint64 recordedAt;
        bytes32 repoHash;
        bytes32 refHash;
        bytes32 noteHash;
        string repo;
        string ref;
    }

    /// @notice Number of reviews ever signed, across all records.
    uint256 public totalReviews;
    /// @notice Number of wallets with at least one record.
    uint256 public authorCount;

    /// @dev Records by id - 1 (ids start at 1).
    Record[] private _records;
    mapping(uint256 id => string) private _repoOf;
    mapping(uint256 id => string) private _refOf;
    /// @dev Record id per (author, repoHash, refHash, kind); 0 when absent.
    mapping(bytes32 key => uint256 id) private _idOfKey;
    mapping(address author => uint256[]) private _byAuthor;
    mapping(bytes32 repoHash => uint256[]) private _byRepo;
    mapping(uint256 id => Review[]) private _reviews;
    mapping(uint256 id => mapping(address reviewer => bool)) private _reviewed;

    event Recorded(
        uint256 indexed id,
        address indexed author,
        bytes32 indexed repoHash,
        bytes32 refHash,
        uint8 kind,
        uint8 role,
        bytes32 noteHash,
        string repo,
        string ref,
        uint64 chainBlock
    );

    event Reviewed(uint256 indexed id, address indexed reviewer, address indexed author, uint32 reviewCount, uint64 chainBlock);

    error BadRepo();
    error BadRef();
    error BadKind(uint8 kind);
    error BadRole(uint8 role);
    error AlreadyRecorded(uint256 id);
    error UnknownRecord(uint256 id);
    error SelfReview();
    error AlreadyReviewed(uint256 id);

    /// @notice Records a reference to a commit or a pull request the sender worked on.
    /// @param repo  lower-case "owner/name" of a GitHub repository (letters, digits, "-", "_", ".").
    /// @param ref   for a commit: the full 40-character lower-case SHA; for a pull request: its number in decimal.
    /// @param kind  KIND_COMMIT or KIND_PULL.
    /// @param role  1..MAX_ROLE.
    /// @param noteHash keccak-256 of an optional note kept off chain (zero for none).
    /// @return id   the new record id (starting at 1).
    function record(string calldata repo, string calldata ref, uint8 kind, uint8 role, bytes32 noteHash)
        external
        returns (uint256 id)
    {
        if (kind != KIND_COMMIT && kind != KIND_PULL) revert BadKind(kind);
        if (role == 0 || role > MAX_ROLE) revert BadRole(role);
        if (!_validRepo(bytes(repo))) revert BadRepo();
        if (!(kind == KIND_COMMIT ? _validSha(bytes(ref)) : _validNumber(bytes(ref)))) revert BadRef();

        bytes32 repoHash = keccak256(bytes(repo));
        bytes32 refHash = keccak256(bytes(ref));
        bytes32 key = keccak256(abi.encode(msg.sender, repoHash, refHash, kind));
        uint256 existing = _idOfKey[key];
        if (existing != 0) revert AlreadyRecorded(existing);

        uint64 blk = chainBlock();
        _records.push(
            Record({
                author: msg.sender,
                kind: kind,
                role: role,
                reviewCount: 0,
                recordedBlock: blk,
                recordedAt: uint64(block.timestamp),
                repoHash: repoHash,
                refHash: refHash,
                noteHash: noteHash
            })
        );
        id = _records.length;
        _repoOf[id] = repo;
        _refOf[id] = ref;
        _idOfKey[key] = id;
        uint256[] storage mine = _byAuthor[msg.sender];
        if (mine.length == 0) {
            unchecked {
                authorCount += 1;
            }
        }
        mine.push(id);
        _byRepo[repoHash].push(id);
        _emitRecorded(id, repo, ref);
    }

    /// @dev Emits Recorded from the stored record (kept apart to stay within the stack limit).
    function _emitRecorded(uint256 id, string calldata repo, string calldata ref) private {
        Record storage r = _records[id - 1];
        emit Recorded(id, r.author, r.repoHash, r.refHash, r.kind, r.role, r.noteHash, repo, ref, r.recordedBlock);
    }

    /// @notice Co-signs a record as its reviewer. Any wallet except the record's author, once per record.
    function review(uint256 id) external {
        if (id == 0 || id > _records.length) revert UnknownRecord(id);
        Record storage r = _records[id - 1];
        if (r.author == msg.sender) revert SelfReview();
        if (_reviewed[id][msg.sender]) revert AlreadyReviewed(id);
        _reviewed[id][msg.sender] = true;
        uint64 blk = chainBlock();
        _reviews[id].push(Review({reviewer: msg.sender, reviewedBlock: blk, reviewedAt: uint64(block.timestamp)}));
        unchecked {
            r.reviewCount += 1;
            totalReviews += 1;
        }
        emit Reviewed(id, msg.sender, r.author, r.reviewCount, blk);
    }

    // ---------------------------------------------------------------- reads

    /// @notice Number of records ever made (the highest id).
    function recordCount() external view returns (uint256) {
        return _records.length;
    }

    /// @notice One record. Reverts for an unknown id.
    function getRecord(uint256 id) public view returns (RecordView memory v) {
        if (id == 0 || id > _records.length) revert UnknownRecord(id);
        Record storage r = _records[id - 1];
        v = RecordView({
            id: id,
            author: r.author,
            kind: r.kind,
            role: r.role,
            reviewCount: r.reviewCount,
            recordedBlock: r.recordedBlock,
            recordedAt: r.recordedAt,
            repoHash: r.repoHash,
            refHash: r.refHash,
            noteHash: r.noteHash,
            repo: _repoOf[id],
            ref: _refOf[id]
        });
    }

    /// @notice Up to `limit` (max MAX_PAGE) records by id, starting at id `fromId` (ids start at 1).
    function records(uint256 fromId, uint256 limit) external view returns (RecordView[] memory out) {
        uint256 n = _records.length;
        if (fromId == 0 || fromId > n || limit == 0) return new RecordView[](0);
        uint256 count = _min(n - fromId + 1, _min(limit, MAX_PAGE));
        out = new RecordView[](count);
        for (uint256 i = 0; i < count; i++) {
            out[i] = getRecord(fromId + i);
        }
    }

    /// @notice How many records a wallet made.
    function countByAuthor(address author) external view returns (uint256) {
        return _byAuthor[author].length;
    }

    /// @notice Up to `limit` (max MAX_PAGE) record ids of one wallet, oldest first.
    function idsByAuthor(address author, uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        return _page(_byAuthor[author], offset, limit);
    }

    /// @notice How many records point at a repository (by keccak-256 of its lower-case "owner/name").
    function countForRepo(bytes32 repoHash) external view returns (uint256) {
        return _byRepo[repoHash].length;
    }

    /// @notice Up to `limit` (max MAX_PAGE) record ids for one repository, oldest first.
    function idsForRepo(bytes32 repoHash, uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        return _page(_byRepo[repoHash], offset, limit);
    }

    /// @notice The record id a wallet made for this exact reference (0 when none).
    function idOf(address author, bytes32 repoHash, bytes32 refHash, uint8 kind) external view returns (uint256) {
        return _idOfKey[keccak256(abi.encode(author, repoHash, refHash, kind))];
    }

    /// @notice True when `reviewer` co-signed record `id`.
    function hasReviewed(uint256 id, address reviewer) external view returns (bool) {
        return _reviewed[id][reviewer];
    }

    /// @notice Up to `limit` (max MAX_PAGE) reviews of a record, in signing order.
    function reviewsOf(uint256 id, uint256 offset, uint256 limit) external view returns (Review[] memory out) {
        Review[] storage all = _reviews[id];
        uint256 n = all.length;
        if (offset >= n || limit == 0) return new Review[](0);
        uint256 count = _min(n - offset, _min(limit, MAX_PAGE));
        out = new Review[](count);
        for (uint256 i = 0; i < count; i++) {
            out[i] = all[offset + i];
        }
    }

    /// @notice The chain's current block: ArbSys `arbBlockNumber()` when the precompile answers, else `block.number`.
    function chainBlock() public view returns (uint64) {
        (bool ok, bytes memory ret) = ARB_SYS.staticcall{gas: ARB_SYS_GAS}(abi.encodeWithSelector(ARB_BLOCK_NUMBER));
        if (ok && ret.length == 32) {
            uint256 n = abi.decode(ret, (uint256));
            if (n != 0 && n <= type(uint64).max) return uint64(n);
        }
        return uint64(block.number);
    }

    // ---------------------------------------------------------------- checks

    /// @dev "owner/name": one slash, both parts non-empty, owner at most 39 bytes, total at most MAX_REPO_LENGTH,
    ///      lower-case letters, digits, "-", "_" and "." only, and neither part is "." or "..".
    function _validRepo(bytes memory s) private pure returns (bool) {
        uint256 n = s.length;
        if (n < 3 || n > MAX_REPO_LENGTH) return false;
        uint256 slash = type(uint256).max;
        for (uint256 i = 0; i < n; i++) {
            bytes1 c = s[i];
            if (c == "/") {
                if (slash != type(uint256).max) return false;
                slash = i;
            } else if (!((c >= "a" && c <= "z") || (c >= "0" && c <= "9") || c == "-" || c == "_" || c == ".")) {
                return false;
            }
        }
        if (slash == type(uint256).max || slash == 0 || slash == n - 1 || slash > 39) return false;
        if (_dots(s, 0, slash) || _dots(s, slash + 1, n)) return false;
        return true;
    }

    /// @dev True when s[from:to] is "." or "..".
    function _dots(bytes memory s, uint256 from, uint256 to) private pure returns (bool) {
        uint256 len = to - from;
        if (len == 1) return s[from] == ".";
        if (len == 2) return s[from] == "." && s[from + 1] == ".";
        return false;
    }

    /// @dev Exactly 40 lower-case hex characters.
    function _validSha(bytes memory s) private pure returns (bool) {
        if (s.length != 40) return false;
        for (uint256 i = 0; i < 40; i++) {
            bytes1 c = s[i];
            if (!((c >= "0" && c <= "9") || (c >= "a" && c <= "f"))) return false;
        }
        return true;
    }

    /// @dev 1 to 10 decimal digits without a leading zero.
    function _validNumber(bytes memory s) private pure returns (bool) {
        uint256 n = s.length;
        if (n == 0 || n > 10 || s[0] == "0") return false;
        for (uint256 i = 0; i < n; i++) {
            if (s[i] < "0" || s[i] > "9") return false;
        }
        return true;
    }

    function _page(uint256[] storage all, uint256 offset, uint256 limit) private view returns (uint256[] memory out) {
        uint256 n = all.length;
        if (offset >= n || limit == 0) return new uint256[](0);
        uint256 count = _min(n - offset, _min(limit, MAX_PAGE));
        out = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            out[i] = all[offset + i];
        }
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
}
