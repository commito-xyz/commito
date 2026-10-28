// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CommitoRecordBook} from "../../src/CommitoRecordBook.sol";

/// Fork test against Robinhood Chain mainnet. The record book integrates with no other contract; the fork checks that
/// it deploys and runs on the real chain state and that its block reads give the chain's own (L2) block numbers.
///   forge test --match-path 'test/fork/*' --fork-url https://robinhood.drpc.org --evm-version cancun
contract CommitoForkTest is Test {
    function setUp() public {
        vm.skip(block.chainid != 4663);
    }

    function test_fork_recordAndReview() public {
        CommitoRecordBook book = new CommitoRecordBook();
        uint256 id = book.record("ethereum/go-ethereum", "0123456789abcdef0123456789abcdef01234567", 1, 1, bytes32(0));
        vm.prank(address(0xBEEF));
        book.review(id);
        assertEq(book.getRecord(id).reviewCount, 1);
        assertGt(book.getRecord(id).recordedBlock, 90_000_000);
    }

    function test_fork_chainBlockIsTheL2Block() public {
        CommitoRecordBook book = new CommitoRecordBook();
        assertEq(book.chainBlock(), uint64(block.number));
        assertGt(block.number, 90_000_000);
    }
}
