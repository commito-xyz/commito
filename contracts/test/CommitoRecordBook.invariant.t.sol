// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CommitoRecordBook} from "../src/CommitoRecordBook.sol";

/// Drives random records and reviews from a small set of wallets and keeps its own tally.
contract RecordHandler is Test {
    CommitoRecordBook public book;
    address[4] public wallets = [address(0x1001), address(0x1002), address(0x1003), address(0x1004)];
    string[3] public repos = ["alpha/one", "beta/two", "gamma/three"];

    uint256 public madeRecords;
    uint256 public madeReviews;
    mapping(address => uint256) public madeBy;
    mapping(bytes32 => uint256) public madeFor;

    constructor(CommitoRecordBook b) {
        book = b;
    }

    function record(uint256 w, uint256 r, uint32 pr, uint8 role) external {
        address who = wallets[w % 4];
        string memory repo = repos[r % 3];
        string memory ref = vm.toString(uint256(pr % 50) + 1);
        uint8 rl = uint8(role % 6) + 1;
        vm.prank(who);
        try book.record(repo, ref, 2, rl, bytes32(0)) {
            madeRecords++;
            madeBy[who]++;
            madeFor[keccak256(bytes(repo))]++;
        } catch {}
    }

    function review(uint256 w, uint256 id) external {
        uint256 n = book.recordCount();
        if (n == 0) return;
        id = (id % n) + 1;
        address who = wallets[w % 4];
        vm.prank(who);
        try book.review(id) {
            madeReviews++;
        } catch {}
    }

    function walletAt(uint256 i) external view returns (address) {
        return wallets[i];
    }

    function repoAt(uint256 i) external view returns (string memory) {
        return repos[i];
    }
}

contract CommitoRecordBookInvariantTest is Test {
    CommitoRecordBook book;
    RecordHandler handler;

    function setUp() public {
        book = new CommitoRecordBook();
        handler = new RecordHandler(book);
        targetContract(address(handler));
    }

    function invariant_countsMatchTheTally() public view {
        assertEq(book.recordCount(), handler.madeRecords());
        assertEq(book.totalReviews(), handler.madeReviews());
        uint256 sum;
        for (uint256 i = 0; i < 4; i++) {
            address w = handler.walletAt(i);
            assertEq(book.countByAuthor(w), handler.madeBy(w));
            sum += book.countByAuthor(w);
        }
        assertEq(sum, book.recordCount());
        uint256 repoSum;
        for (uint256 i = 0; i < 3; i++) {
            bytes32 h = keccak256(bytes(handler.repoAt(i)));
            assertEq(book.countForRepo(h), handler.madeFor(h));
            repoSum += book.countForRepo(h);
        }
        assertEq(repoSum, book.recordCount());
    }

    function invariant_noSelfReviewAndReviewSumMatches() public view {
        uint256 n = book.recordCount();
        uint256 sum;
        for (uint256 id = 1; id <= n; id++) {
            CommitoRecordBook.RecordView memory v = book.getRecord(id);
            assertFalse(book.hasReviewed(id, v.author));
            CommitoRecordBook.Review[] memory rs = book.reviewsOf(id, 0, 100);
            assertEq(rs.length, v.reviewCount);
            for (uint256 j = 0; j < rs.length; j++) assertTrue(rs[j].reviewer != v.author);
            sum += v.reviewCount;
            assertEq(book.idOf(v.author, v.repoHash, v.refHash, v.kind), id);
        }
        assertEq(sum, book.totalReviews());
    }

    function invariant_holdsNoEth() public view {
        assertEq(address(book).balance, 0);
    }
}
