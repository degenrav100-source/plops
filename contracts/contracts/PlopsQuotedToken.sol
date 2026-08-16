// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PlopsQuotedToken
/// @notice Same non-custodial x*y=k curve as `PlopsBondingToken`, but priced in an
///         ERC20 quote asset (e.g. a tokenized stock on the Robinhood Chain) instead
///         of native ETH. Buyers pay in the quote token, sellers are paid in it.
/// @dev    The quote reserve is tracked explicitly rather than read from
///         `balanceOf(this)`, so a donation or a fee-on-transfer quote token cannot
///         shift the price; `_pullQuote` credits only what actually arrived.
contract PlopsQuotedToken is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev Fixed total supply: 1,000,000,000 tokens (18 decimals).
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether;
    /// @dev Trading fee in basis points (1% = 100) paid to the creator.
    uint256 public constant FEE_BPS = 100;
    uint256 private constant BPS = 10_000;

    /// @notice ERC20 the curve is priced in.
    IERC20 public immutable quote;
    /// @notice Virtual quote reserve seeding the curve (never withdrawable; sets the start price).
    uint256 public immutable virtualQuote;

    /// @notice Quote reserve used for pricing (virtual + real).
    uint256 public quoteReserve;
    /// @notice Tokens still held by the curve and available to buy.
    uint256 public tokenReserve;
    /// @notice Creator / fee recipient.
    address public immutable creator;

    // --- Off-chain metadata, set once at deploy ---
    string public description;
    string public imageURI;
    string public twitter;
    string public telegram;
    string public website;

    event Trade(
        address indexed trader,
        bool isBuy,
        uint256 quoteAmount,
        uint256 tokenAmount,
        uint256 fee,
        uint256 quoteReserve,
        uint256 tokenReserve
    );

    struct Metadata {
        string description;
        string imageURI;
        string twitter;
        string telegram;
        string website;
    }

    /// @param quote_ ERC20 used as the quote asset.
    /// @param virtualQuote_ Virtual reserve in quote units; sets the starting price.
    constructor(
        string memory name_,
        string memory symbol_,
        address creator_,
        IERC20 quote_,
        uint256 virtualQuote_,
        Metadata memory meta
    ) ERC20(name_, symbol_) {
        require(creator_ != address(0), "creator=0");
        require(address(quote_) != address(0), "quote=0");
        require(virtualQuote_ > 0, "virtual=0");
        creator = creator_;
        quote = quote_;
        virtualQuote = virtualQuote_;
        quoteReserve = virtualQuote_;
        tokenReserve = TOTAL_SUPPLY;
        description = meta.description;
        imageURI = meta.imageURI;
        twitter = meta.twitter;
        telegram = meta.telegram;
        website = meta.website;

        _mint(address(this), TOTAL_SUPPLY);
    }

    /// @notice Quote units actually held by the contract (redeemable by sellers).
    function realQuoteReserve() public view returns (uint256) {
        return quoteReserve - virtualQuote;
    }

    /// @notice Quote tokens received for `quoteIn` (fee already deducted).
    function quoteBuy(uint256 quoteIn) public view returns (uint256 tokensOut, uint256 fee) {
        fee = (quoteIn * FEE_BPS) / BPS;
        uint256 forCurve = quoteIn - fee;
        tokensOut = (tokenReserve * forCurve) / (quoteReserve + forCurve);
    }

    /// @notice Quote units received for selling `tokenAmount` (fee already deducted).
    function quoteSell(uint256 tokenAmount) public view returns (uint256 quoteOut, uint256 fee) {
        uint256 gross = (quoteReserve * tokenAmount) / (tokenReserve + tokenAmount);
        fee = (gross * FEE_BPS) / BPS;
        quoteOut = gross - fee;
    }

    /// @notice Current price in quote base units per whole token (1e18 base units).
    function currentPrice() external view returns (uint256) {
        return (quoteReserve * 1e18) / tokenReserve;
    }

    /// @notice Buy tokens from the curve with `quoteIn` quote units. Requires an
    ///         ERC20 allowance for this contract. `minTokensOut` guards slippage.
    function buy(uint256 quoteIn, uint256 minTokensOut) external {
        buyFor(msg.sender, quoteIn, minTokensOut);
    }

    /// @notice Buy with the caller's quote tokens and credit `to`. Lets the factory
    ///         perform the creator's seed buy in the launch transaction.
    function buyFor(address to, uint256 quoteIn, uint256 minTokensOut) public nonReentrant {
        require(quoteIn > 0, "no quote");
        require(to != address(0), "to=0");
        uint256 received = _pullQuote(msg.sender, quoteIn);
        _buy(to, received, minTokensOut);
    }

    function _pullQuote(address from, uint256 amount) private returns (uint256 received) {
        uint256 before = quote.balanceOf(address(this));
        quote.safeTransferFrom(from, address(this), amount);
        received = quote.balanceOf(address(this)) - before;
        require(received > 0, "no quote received");
    }

    function _buy(address to, uint256 quoteIn, uint256 minTokensOut) private {
        uint256 fee = (quoteIn * FEE_BPS) / BPS;
        uint256 forCurve = quoteIn - fee;
        uint256 tokensOut = (tokenReserve * forCurve) / (quoteReserve + forCurve);
        require(tokensOut >= minTokensOut, "slippage");
        require(tokensOut > 0, "dust");
        require(tokensOut <= tokenReserve, "insufficient curve supply");

        quoteReserve += forCurve;
        tokenReserve -= tokensOut;
        _transfer(address(this), to, tokensOut);

        if (fee > 0) {
            quote.safeTransfer(creator, fee);
        }
        emit Trade(to, true, quoteIn, tokensOut, fee, quoteReserve, tokenReserve);
    }

    /// @notice Sell tokens back to the curve for quote units. `minQuoteOut` guards slippage.
    function sell(uint256 tokenAmount, uint256 minQuoteOut) external nonReentrant {
        require(tokenAmount > 0, "no tokens");
        require(balanceOf(msg.sender) >= tokenAmount, "balance too low");

        uint256 gross = (quoteReserve * tokenAmount) / (tokenReserve + tokenAmount);
        uint256 fee = (gross * FEE_BPS) / BPS;
        uint256 quoteOut = gross - fee;
        require(quoteOut >= minQuoteOut, "slippage");
        require(gross <= quote.balanceOf(address(this)), "reserve underflow");

        quoteReserve -= gross;
        tokenReserve += tokenAmount;
        _transfer(msg.sender, address(this), tokenAmount);

        if (fee > 0) {
            quote.safeTransfer(creator, fee);
        }
        quote.safeTransfer(msg.sender, quoteOut);
        emit Trade(msg.sender, false, quoteOut, tokenAmount, fee, quoteReserve, tokenReserve);
    }
}
