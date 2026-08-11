// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {PlopsBondingToken} from "./PlopsBondingToken.sol";

/// @title PlopsFactory
/// @notice Single on-chain index of every plops launch. Tokens deployed through
///         `launch` are appended to a public array, so any client can page the
///         full list from a plain RPC node — no backend or log scan required.
/// @dev    The factory never holds ETH or token supply: `msg.value` is forwarded
///         to the token constructor as the creator's seed buy, and the token is
///         owned by its curve exactly like a directly deployed one.
contract PlopsFactory {
    address[] public tokens;
    /// @notice Launch index + 1 for a token address (0 = not launched here).
    mapping(address => uint256) private tokenIndexPlusOne;
    mapping(address => address[]) private tokensByCreator;

    event TokenLaunched(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        string imageURI,
        uint256 initialBuyWei,
        uint256 timestamp
    );

    /// @notice Deploy a bonding-curve token and index it. Any ETH sent is the
    ///         creator's first buy on the new curve.
    function launch(
        string calldata name_,
        string calldata symbol_,
        PlopsBondingToken.Metadata calldata meta
    ) external payable returns (address token) {
        PlopsBondingToken deployed = new PlopsBondingToken{value: msg.value}(
            name_,
            symbol_,
            msg.sender,
            meta
        );
        token = address(deployed);

        tokens.push(token);
        tokenIndexPlusOne[token] = tokens.length;
        tokensByCreator[msg.sender].push(token);

        emit TokenLaunched(
            token,
            msg.sender,
            name_,
            symbol_,
            meta.imageURI,
            msg.value,
            block.timestamp
        );
    }

    function tokensCount() external view returns (uint256) {
        return tokens.length;
    }

    /// @notice Page the index. Reads are clamped, so `tokensSlice(0, 1e9)` is safe.
    function tokensSlice(uint256 start, uint256 limit) external view returns (address[] memory page) {
        uint256 total = tokens.length;
        if (start >= total) return new address[](0);
        uint256 end = start + limit;
        if (end > total) end = total;
        page = new address[](end - start);
        for (uint256 i = start; i < end; i++) {
            page[i - start] = tokens[i];
        }
    }

    /// @notice Newest launches first — what a launchpad feed wants by default.
    function latestTokens(uint256 limit) external view returns (address[] memory page) {
        uint256 total = tokens.length;
        uint256 n = limit > total ? total : limit;
        page = new address[](n);
        for (uint256 i = 0; i < n; i++) {
            page[i] = tokens[total - 1 - i];
        }
    }

    function creatorTokens(address creator) external view returns (address[] memory) {
        return tokensByCreator[creator];
    }

    /// @notice True when `token` was launched through this factory (anti-impersonation check).
    function isPlopsToken(address token) external view returns (bool) {
        return tokenIndexPlusOne[token] != 0;
    }
}
