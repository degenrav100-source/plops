// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PlopsBondingToken
/// @notice Non-custodial ERC20 with a constant-product (x*y=k) bonding curve.
///         The entire supply is minted to the contract and sold along the curve;
///         holders can always sell back for ETH held in the contract. Built on
///         OpenZeppelin's audited ERC20 + ReentrancyGuard.
/// @dev    Both reserves are tracked explicitly and every output is floored, so
///         the contract can never pay out more real ETH than it holds.
contract PlopsBondingToken is ERC20, ReentrancyGuard {
    /// @dev Fixed total supply: 1,000,000,000 tokens (18 decimals).
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether;
    /// @dev Virtual ETH reserve seeding the curve (never withdrawable; sets the start price).
    uint256 public constant VIRTUAL_ETH = 1 ether;
    /// @dev Trading fee in basis points (1% = 100) paid to the creator.
    uint256 public constant FEE_BPS = 100;
    uint256 private constant BPS = 10_000;

    /// @notice ETH reserve used for pricing (virtual + real). Real ETH = ethReserve - VIRTUAL_ETH.
    uint256 public ethReserve;
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
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 fee,
        uint256 ethReserve,
        uint256 tokenReserve
    );

    struct Metadata {
        string description;
        string imageURI;
        string twitter;
        string telegram;
        string website;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address creator_,
        Metadata memory meta
    ) payable ERC20(name_, symbol_) {
        require(creator_ != address(0), "creator=0");
        creator = creator_;
        ethReserve = VIRTUAL_ETH;
        tokenReserve = TOTAL_SUPPLY;
        description = meta.description;
        imageURI = meta.imageURI;
        twitter = meta.twitter;
        telegram = meta.telegram;
        website = meta.website;

        // Mint the entire supply to the curve (this contract).
        _mint(address(this), TOTAL_SUPPLY);

        // Optional creator seed buy in the same transaction.
        if (msg.value > 0) {
            _buy(creator_, msg.value, 0);
        }
    }

    /// @notice ETH actually held by the contract (redeemable by sellers).
    function realEthReserve() public view returns (uint256) {
        return ethReserve - VIRTUAL_ETH;
    }

    /// @notice Quote tokens received for `ethIn` (fee already deducted).
    function quoteBuy(uint256 ethIn) public view returns (uint256 tokensOut, uint256 fee) {
        fee = (ethIn * FEE_BPS) / BPS;
        uint256 ethForCurve = ethIn - fee;
        tokensOut = (tokenReserve * ethForCurve) / (ethReserve + ethForCurve);
    }

    /// @notice Quote ETH received for selling `tokenAmount` (fee already deducted).
    function quoteSell(uint256 tokenAmount) public view returns (uint256 ethOut, uint256 fee) {
        uint256 grossEth = (ethReserve * tokenAmount) / (tokenReserve + tokenAmount);
        fee = (grossEth * FEE_BPS) / BPS;
        ethOut = grossEth - fee;
    }

    /// @notice Current price in wei per whole token (1e18 base units).
    function currentPrice() external view returns (uint256) {
        return (ethReserve * 1e18) / tokenReserve;
    }

    /// @notice Buy tokens from the curve. `minTokensOut` guards slippage.
    function buy(uint256 minTokensOut) external payable nonReentrant {
        require(msg.value > 0, "no ETH");
        _buy(msg.sender, msg.value, minTokensOut);
    }

    function _buy(address to, uint256 ethIn, uint256 minTokensOut) private {
        uint256 fee = (ethIn * FEE_BPS) / BPS;
        uint256 ethForCurve = ethIn - fee;
        uint256 tokensOut = (tokenReserve * ethForCurve) / (ethReserve + ethForCurve);
        require(tokensOut >= minTokensOut, "slippage");
        require(tokensOut > 0, "dust");
        require(tokensOut <= tokenReserve, "insufficient curve supply");

        ethReserve += ethForCurve;
        tokenReserve -= tokensOut;
        _transfer(address(this), to, tokensOut);

        if (fee > 0) {
            (bool ok, ) = payable(creator).call{value: fee}("");
            require(ok, "fee xfer failed");
        }
        emit Trade(to, true, ethIn, tokensOut, fee, ethReserve, tokenReserve);
    }

    /// @notice Sell tokens back to the curve for ETH. `minEthOut` guards slippage.
    function sell(uint256 tokenAmount, uint256 minEthOut) external nonReentrant {
        require(tokenAmount > 0, "no tokens");
        require(balanceOf(msg.sender) >= tokenAmount, "balance too low");

        uint256 grossEth = (ethReserve * tokenAmount) / (tokenReserve + tokenAmount);
        uint256 fee = (grossEth * FEE_BPS) / BPS;
        uint256 ethOut = grossEth - fee;
        require(ethOut >= minEthOut, "slippage");
        require(grossEth <= address(this).balance, "reserve underflow");

        ethReserve -= grossEth;
        tokenReserve += tokenAmount;
        _transfer(msg.sender, address(this), tokenAmount);

        if (fee > 0) {
            (bool okFee, ) = payable(creator).call{value: fee}("");
            require(okFee, "fee xfer failed");
        }
        (bool ok, ) = payable(msg.sender).call{value: ethOut}("");
        require(ok, "eth xfer failed");
        emit Trade(msg.sender, false, ethOut, tokenAmount, fee, ethReserve, tokenReserve);
    }
}
