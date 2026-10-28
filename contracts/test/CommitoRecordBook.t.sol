// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CommitoRecordBook} from "../src/CommitoRecordBook.sol";

/// Returns a fixed L2 block, like the ArbSys precompile on Robinhood Chain.
contract FakeArbSys {
    function arbBlockNumber() external pure returns (uint256) {
        return 95_000_123;
    }
}

/// Burns all gas it is given, like broken code at 0x64.
contract GasBurner {
    fallback() external {
        while (true) {}
    }
}

/// Answers with zero, like a chain where 0x64 is an empty stub.
contract ZeroArbSys {
    function arbBlockNumber() external pure returns (uint256) {
        return 0;
    }
}

contract CommitoRecordBookTest is Test {
    CommitoRecordBook book;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address carol = address(0xCA201);

    string constant REPO = "vercel/next.js";
    string constant SHA = "0123456789abcdef0123456789abcdef01234567";
    bytes32 constant NOTE = keccak256("fixed the router cache");

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

    function setUp() public {
        vm.roll(500);
        vm.warp(1_800_000_000);
        book = new CommitoRecordBook();
    }

    function _commit(address who, string memory repo, string memory sha) internal returns (uint256) {
        vm.prank(who);
        return book.record(repo, sha, 1, 1, NOTE);
    }

    // ------------------------------------------------------------ record

    function test_record_storesEverything() public {
        vm.expectEmit(true, true, true, true);
        emit Recorded(1, alice, keccak256(bytes(REPO)), keccak256(bytes(SHA)), 1, 1, NOTE, REPO, SHA, 500);
        uint256 id = _commit(alice, REPO, SHA);
        assertEq(id, 1);
        CommitoRecordBook.RecordView memory v = book.getRecord(1);
        assertEq(v.id, 1);
        assertEq(v.author, alice);
        assertEq(v.kind, 1);
        assertEq(v.role, 1);
        assertEq(v.reviewCount, 0);
        assertEq(v.recordedBlock, 500);
        assertEq(v.recordedAt, 1_800_000_000);
        assertEq(v.repoHash, keccak256(bytes(REPO)));
        assertEq(v.refHash, keccak256(bytes(SHA)));
        assertEq(v.noteHash, NOTE);
        assertEq(v.repo, REPO);
        assertEq(v.ref, SHA);
        assertEq(book.recordCount(), 1);
        assertEq(book.authorCount(), 1);
        assertEq(book.countByAuthor(alice), 1);
        assertEq(book.countForRepo(keccak256(bytes(REPO))), 1);
        assertEq(book.idOf(alice, keccak256(bytes(REPO)), keccak256(bytes(SHA)), 1), 1);
        assertEq(book.idOf(bob, keccak256(bytes(REPO)), keccak256(bytes(SHA)), 1), 0);
    }

    function test_record_pullRequest() public {
        vm.prank(alice);
        uint256 id = book.record("facebook/react", "31337", 2, 3, bytes32(0));
        CommitoRecordBook.RecordView memory v = book.getRecord(id);
        assertEq(v.kind, 2);
        assertEq(v.role, 3);
        assertEq(v.ref, "31337");
        assertEq(v.noteHash, bytes32(0));
    }

    function test_record_sameRefDifferentWalletsAndKinds() public {
        _commit(alice, REPO, SHA);
        _commit(bob, REPO, SHA);
        vm.prank(alice);
        book.record(REPO, "1234", 2, 1, NOTE);
        vm.prank(alice);
        book.record(REPO, "12", 2, 1, NOTE);
        assertEq(book.recordCount(), 4);
        assertEq(book.authorCount(), 2);
        assertEq(book.countByAuthor(alice), 3);
        assertEq(book.countForRepo(keccak256(bytes(REPO))), 4);
    }

    function test_record_revertsWhenAlreadyRecorded() public {
        _commit(alice, REPO, SHA);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(CommitoRecordBook.AlreadyRecorded.selector, 1));
        book.record(REPO, SHA, 1, 4, bytes32(0));
    }

    function test_record_badKind() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(CommitoRecordBook.BadKind.selector, 0));
        book.record(REPO, SHA, 0, 1, NOTE);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(CommitoRecordBook.BadKind.selector, 3));
        book.record(REPO, SHA, 3, 1, NOTE);
    }

    function test_record_badRole() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(CommitoRecordBook.BadRole.selector, 0));
        book.record(REPO, SHA, 1, 0, NOTE);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(CommitoRecordBook.BadRole.selector, 7));
        book.record(REPO, SHA, 1, 7, NOTE);
        vm.prank(alice);
        book.record(REPO, SHA, 1, 6, NOTE);
    }

    function test_record_badRepos() public {
        string[14] memory bad = [
            "",
            "ab",
            "noslash",
            "/name",
            "owner/",
            "a/b/c",
            "Owner/name",
            "owner/na me",
            "owner/.",
            "./name",
            "owner/..",
            "../x",
            "owner/n@me",
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/x"
        ];
        for (uint256 i = 0; i < bad.length; i++) {
            vm.prank(alice);
            vm.expectRevert(CommitoRecordBook.BadRepo.selector);
            book.record(bad[i], SHA, 1, 1, NOTE);
        }
    }

    function test_record_repoLengthLimits() public {
        string memory owner = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        bytes memory name = new bytes(100);
        for (uint256 i = 0; i < 100; i++) name[i] = "b";
        string memory ok = string.concat(owner, "/", string(name));
        assertEq(bytes(ok).length, 140);
        vm.prank(alice);
        book.record(ok, SHA, 1, 1, NOTE);
        bytes memory longer = new bytes(101);
        for (uint256 i = 0; i < 101; i++) longer[i] = "b";
        vm.prank(alice);
        vm.expectRevert(CommitoRecordBook.BadRepo.selector);
        book.record(string.concat(owner, "/", string(longer)), SHA, 1, 1, NOTE);
    }

    function test_record_acceptsDotsAndDashesInsideNames() public {
        vm.prank(alice);
        book.record("a-b_c.d/.github", SHA, 1, 1, NOTE);
        vm.prank(alice);
        book.record("x/...", SHA, 1, 1, NOTE);
        assertEq(book.recordCount(), 2);
    }

    function test_record_badShas() public {
        string[5] memory bad = [
            "",
            "0123456789abcdef0123456789abcdef0123456",
            "0123456789abcdef0123456789abcdef012345678",
            "0123456789ABCDEF0123456789abcdef01234567",
            "0123456789abcdeg0123456789abcdef01234567"
        ];
        for (uint256 i = 0; i < bad.length; i++) {
            vm.prank(alice);
            vm.expectRevert(CommitoRecordBook.BadRef.selector);
            book.record(REPO, bad[i], 1, 1, NOTE);
        }
    }

    function test_record_badPullNumbers() public {
        string[6] memory bad = ["", "0", "012", "12a", "12345678901", "-1"];
        for (uint256 i = 0; i < bad.length; i++) {
            vm.prank(alice);
            vm.expectRevert(CommitoRecordBook.BadRef.selector);
            book.record(REPO, bad[i], 2, 1, NOTE);
        }
        vm.prank(alice);
        book.record(REPO, "1234567890", 2, 1, NOTE);
    }

    function test_record_shaIsNotAPullNumber() public {
        vm.prank(alice);
        vm.expectRevert(CommitoRecordBook.BadRef.selector);
        book.record(REPO, SHA, 2, 1, NOTE);
        vm.prank(alice);
        vm.expectRevert(CommitoRecordBook.BadRef.selector);
        book.record(REPO, "42", 1, 1, NOTE);
    }

    // ------------------------------------------------------------ review

    function test_review_byAnotherWallet() public {
        _commit(alice, REPO, SHA);
        vm.roll(510);
        vm.warp(1_800_000_100);
        vm.expectEmit(true, true, true, true);
        emit Reviewed(1, bob, alice, 1, 510);
        vm.prank(bob);
        book.review(1);
        vm.prank(carol);
        book.review(1);
        assertEq(book.getRecord(1).reviewCount, 2);
        assertEq(book.totalReviews(), 2);
        assertTrue(book.hasReviewed(1, bob));
        assertTrue(book.hasReviewed(1, carol));
        assertFalse(book.hasReviewed(1, alice));
        CommitoRecordBook.Review[] memory rs = book.reviewsOf(1, 0, 10);
        assertEq(rs.length, 2);
        assertEq(rs[0].reviewer, bob);
        assertEq(rs[0].reviewedBlock, 510);
        assertEq(rs[0].reviewedAt, 1_800_000_100);
        assertEq(rs[1].reviewer, carol);
        assertEq(book.reviewsOf(1, 1, 10).length, 1);
        assertEq(book.reviewsOf(1, 2, 10).length, 0);
        assertEq(book.reviewsOf(1, 0, 0).length, 0);
        assertEq(book.reviewsOf(2, 0, 10).length, 0);
    }

    function test_review_selfIsRefused() public {
        _commit(alice, REPO, SHA);
        vm.prank(alice);
        vm.expectRevert(CommitoRecordBook.SelfReview.selector);
        book.review(1);
    }

    function test_review_oncePerWallet() public {
        _commit(alice, REPO, SHA);
        vm.prank(bob);
        book.review(1);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(CommitoRecordBook.AlreadyReviewed.selector, 1));
        book.review(1);
    }

    function test_review_unknownRecord() public {
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(CommitoRecordBook.UnknownRecord.selector, 0));
        book.review(0);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(CommitoRecordBook.UnknownRecord.selector, 1));
        book.review(1);
    }

    // ------------------------------------------------------------ reads

    function test_getRecord_unknown() public {
        vm.expectRevert(abi.encodeWithSelector(CommitoRecordBook.UnknownRecord.selector, 0));
        book.getRecord(0);
        vm.expectRevert(abi.encodeWithSelector(CommitoRecordBook.UnknownRecord.selector, 1));
        book.getRecord(1);
    }

    function test_pages() public {
        for (uint256 i = 1; i <= 120; i++) {
            vm.prank(alice);
            book.record(REPO, vm.toString(i), 2, 1, NOTE);
        }
        _commit(bob, "other/repo", SHA);
        assertEq(book.records(1, 1000).length, 100);
        assertEq(book.records(101, 1000).length, 21);
        assertEq(book.records(121, 5)[0].author, bob);
        assertEq(book.records(121, 5)[0].repo, "other/repo");
        assertEq(book.records(122, 5).length, 0);
        assertEq(book.records(0, 5).length, 0);
        assertEq(book.records(1, 0).length, 0);
        uint256[] memory a = book.idsByAuthor(alice, 0, 500);
        assertEq(a.length, 100);
        assertEq(a[0], 1);
        assertEq(book.idsByAuthor(alice, 100, 500).length, 20);
        assertEq(book.idsByAuthor(alice, 120, 5).length, 0);
        assertEq(book.idsByAuthor(alice, 0, 0).length, 0);
        uint256[] memory r = book.idsForRepo(keccak256("other/repo"), 0, 5);
        assertEq(r.length, 1);
        assertEq(r[0], 121);
        assertEq(book.idsForRepo(keccak256(bytes(REPO)), 110, 100).length, 10);
    }

    function test_noEth() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        (bool ok,) = address(book).call{value: 1}("");
        assertFalse(ok);
    }

    // ------------------------------------------------------------ chain block

    function test_chainBlock_usesArbSysWhenPresent() public {
        vm.etch(address(0x64), address(new FakeArbSys()).code);
        assertEq(book.chainBlock(), 95_000_123);
        _commit(alice, REPO, SHA);
        assertEq(book.getRecord(1).recordedBlock, 95_000_123);
    }

    function test_chainBlock_fallsBackWhenArbSysBurnsGas() public {
        vm.etch(address(0x64), address(new GasBurner()).code);
        assertEq(book.chainBlock(), 500);
        _commit(alice, REPO, SHA);
        assertEq(book.getRecord(1).recordedBlock, 500);
    }

    function test_chainBlock_fallsBackOnZero() public {
        vm.etch(address(0x64), address(new ZeroArbSys()).code);
        assertEq(book.chainBlock(), 500);
    }

    // ------------------------------------------------------------ fuzz

    function testFuzz_shaRoundTrip(bytes20 raw, address who) public {
        vm.assume(who != address(0));
        string memory sha = _hex(raw);
        vm.prank(who);
        uint256 id = book.record(REPO, sha, 1, 1, bytes32(0));
        assertEq(book.getRecord(id).refHash, keccak256(bytes(sha)));
        assertEq(book.idOf(who, keccak256(bytes(REPO)), keccak256(bytes(sha)), 1), id);
    }

    function testFuzz_pullNumbers(uint32 n) public {
        vm.assume(n > 0);
        vm.prank(alice);
        uint256 id = book.record(REPO, vm.toString(uint256(n)), 2, 2, bytes32(0));
        assertEq(book.getRecord(id).ref, vm.toString(uint256(n)));
    }

    function testFuzz_reviewerNeverAuthor(address author, address reviewer) public {
        vm.assume(author != address(0) && reviewer != address(0));
        _commit(author, REPO, SHA);
        vm.prank(reviewer);
        if (reviewer == author) {
            vm.expectRevert(CommitoRecordBook.SelfReview.selector);
            book.review(1);
        } else {
            book.review(1);
            assertEq(book.getRecord(1).reviewCount, 1);
        }
    }

    function testFuzz_repoCharset(bytes calldata raw) public {
        vm.assume(raw.length < 200);
        bool expectOk = _refValid(raw);
        vm.prank(alice);
        if (!expectOk) vm.expectRevert(CommitoRecordBook.BadRepo.selector);
        book.record(string(raw), SHA, 1, 1, NOTE);
    }

    /// Reference implementation of the repository rule, written apart from the contract.
    function _refValid(bytes memory s) internal pure returns (bool) {
        if (s.length < 3 || s.length > 140) return false;
        uint256 slashes;
        uint256 at;
        for (uint256 i = 0; i < s.length; i++) {
            uint8 c = uint8(s[i]);
            if (c == 0x2f) {
                slashes++;
                at = i;
                continue;
            }
            bool okc = (c >= 0x61 && c <= 0x7a) || (c >= 0x30 && c <= 0x39) || c == 0x2d || c == 0x5f || c == 0x2e;
            if (!okc) return false;
        }
        if (slashes != 1 || at == 0 || at == s.length - 1 || at > 39) return false;
        bytes memory a = new bytes(at);
        for (uint256 i = 0; i < at; i++) a[i] = s[i];
        bytes memory b = new bytes(s.length - at - 1);
        for (uint256 i = 0; i < b.length; i++) b[i] = s[at + 1 + i];
        bytes32 ha = keccak256(a);
        bytes32 hb = keccak256(b);
        if (ha == keccak256(".") || ha == keccak256("..") || hb == keccak256(".") || hb == keccak256("..")) return false;
        return true;
    }

    function _hex(bytes20 v) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory out = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            out[2 * i] = alphabet[uint8(v[i]) >> 4];
            out[2 * i + 1] = alphabet[uint8(v[i]) & 0x0f];
        }
        return string(out);
    }
}
