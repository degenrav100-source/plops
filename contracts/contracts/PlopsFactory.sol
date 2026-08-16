// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {PlopsBondingToken} from "./PlopsBondingToken.sol";
import {PlopsQuotedToken} from "./PlopsQuotedToken.sol";

/// @title PlopsFactory
/// @notice Single on-chain index of every plops launch. Tokens deployed through
///         `launch` are appended to a public array, so any client can page the
///         full list from a plain RPC node — no backend or log scan required.
/// @dev    The factory never holds ETH or token supply: `msg.value` is forwarded
///         to the token constructor as the creator's seed buy, and the token is
///         owned by its curve exactly like a directly deployed one. Launches are
///         priced either in native ETH (`launch`) or in an ERC20 quote asset such
///         as a tokenized stock (`launchWithQuote`).
contract PlopsFactory {
    using SafeERC20 for IERC20;

    address[] public tokens;
    /// @notice Launch index + 1 for a token address (0 = not launched here).
    mapping(address => uint256) private tokenIndexPlusOne;
    mapping(address => address[]) private tokensByCreator;
    /// @notice Quote asset a launch is priced in; `address(0)` means native ETH.
    mapping(address => address) public quoteOf;

    event TokenLaunched(
        address indexed token,
        address indexed creator,
        address indexed quote,
        string name,
        string symbol,
        string imageURI,
        uint256 initialBuy,
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

        _index(token, msg.sender, address(0));
        emit TokenLaunched(
            token,
            msg.sender,
            address(0),
            name_,
            symbol_,
            meta.imageURI,
            msg.value,
            block.timestamp
        );
    }

    /// @notice Deploy a token whose curve is priced in an ERC20 (e.g. a tokenized
    ///         stock) and index it. `initialBuy` quote units are pulled from the
    ///         caller for the creator's first buy, so the caller must approve this
    ///         factory for that amount first.
    /// @dev    The factory holds the seed funds only within this call: it buys on
    ///         the fresh curve and forwards every token it received to the creator.
    function launchWithQuote(
        string calldata name_,
        string calldata symbol_,
        IERC20 quote,
        uint256 virtualQuote,
        uint256 initialBuy,
        PlopsQuotedToken.Metadata calldata meta
    ) external returns (address token) {
        PlopsQuotedToken deployed = new PlopsQuotedToken(
            name_,
            symbol_,
            msg.sender,
            quote,
            virtualQuote,
            meta
        );
        token = address(deployed);

        if (initialBuy > 0) {
            quote.safeTransferFrom(msg.sender, address(this), initialBuy);
            quote.forceApprove(token, initialBuy);
            deployed.buyFor(msg.sender, initialBuy, 0);
            quote.forceApprove(token, 0);
        }

        _index(token, msg.sender, address(quote));
        emit TokenLaunched(
            token,
            msg.sender,
            address(quote),
            name_,
            symbol_,
            meta.imageURI,
            initialBuy,
            block.timestamp
        );
    }

    function _index(address token, address creator, address quote) private {
        tokens.push(token);
        tokenIndexPlusOne[token] = tokens.length;
        tokensByCreator[creator].push(token);
        quoteOf[token] = quote;
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
