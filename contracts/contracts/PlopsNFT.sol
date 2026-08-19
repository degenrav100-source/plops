// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/**
 * The plops genesis collection: 1500 droplets, 0.01 ETH each, art and metadata generated inside
 * the contract. Nothing is hosted off-chain, so the collection cannot break when a pinning
 * service or a website goes away, and marketplaces (OpenSea supports Robinhood Chain) read the
 * same `tokenURI` everyone else does.
 *
 * Art is derived from `keccak256(collection, tokenId)`: fixed the moment the contract is
 * deployed, identical for everyone, and previewable before a mint — there is no reveal step and
 * no way for the deployer to reshuffle rarity afterwards.
 */
contract PlopsNFT is ERC721, ERC2981, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 1500;
    uint256 public constant PRICE = 0.01 ether;
    uint256 public constant MAX_PER_TX = 10;

    uint256 public totalMinted;

    event Minted(address indexed to, uint256 indexed tokenId, uint256 price);

    constructor(address owner_) ERC721("plops genesis", "PLOPS") Ownable(owner_) {
        _setDefaultRoyalty(owner_, 500); // 5%, the OpenSea-honoured creator fee
    }

    // ---------------------------------------------------------------- minting

    function mint(uint256 quantity) external payable nonReentrant {
        mintTo(msg.sender, quantity);
    }

    function mintTo(address to, uint256 quantity) public payable {
        require(to != address(0), "to=0");
        require(quantity > 0 && quantity <= MAX_PER_TX, "bad quantity");
        require(totalMinted + quantity <= MAX_SUPPLY, "sold out");
        require(msg.value == PRICE * quantity, "wrong value");

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = ++totalMinted;
            _safeMint(to, tokenId);
            emit Minted(to, tokenId, PRICE);
        }
    }

    /** Mint proceeds. Pull-free: the owner is the only account that can move them out. */
    function withdraw(address payable to) external onlyOwner nonReentrant {
        require(to != address(0), "to=0");
        (bool ok, ) = to.call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }

    function setRoyalty(address receiver, uint96 feeBps) external onlyOwner {
        _setDefaultRoyalty(receiver, feeBps);
    }

    // ------------------------------------------------------------------- art

    /** Deterministic per-token entropy: the same for every caller, known before the mint. */
    function seedOf(uint256 tokenId) public view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(address(this), tokenId)));
    }

    struct Traits {
        uint256 backdrop;
        uint256 body;
        uint256 eyes;
        uint256 mouth;
        uint256 aura;
        uint256 sparkles;
    }

    function traitsOf(uint256 tokenId) public view returns (Traits memory t) {
        uint256 s = seedOf(tokenId);
        t.backdrop = (s >> 8) % 6;
        t.body = (s >> 24) % 8;
        t.eyes = (s >> 40) % 6;
        t.mouth = (s >> 56) % 5;
        // auras are the rarity axis: ~57% none, then glow, ring, and a 6% halo
        uint256 a = (s >> 72) % 100;
        t.aura = a < 57 ? 0 : a < 80 ? 1 : a < 94 ? 2 : 3;
        t.sparkles = (s >> 88) % 6;
    }

    function backdropName(uint256 i) internal pure returns (string memory) {
        string[6] memory n = ["mist", "lagoon", "bubblegum", "midnight", "sherbet", "glacier"];
        return n[i];
    }

    /** background gradient: inner, outer */
    function backdropColors(uint256 i) internal pure returns (string memory, string memory) {
        string[6] memory inner = ["#f4fbff", "#d9fff1", "#ffe6f4", "#1a2340", "#fff1dc", "#e6f4ff"];
        string[6] memory outer = ["#cfe6ff", "#8fe3c8", "#ffb3d9", "#070b18", "#ffc9a3", "#a9c8ff"];
        return (inner[i], outer[i]);
    }

    function bodyName(uint256 i) internal pure returns (string memory) {
        string[8] memory n = [
            "spring",
            "cotton",
            "reef",
            "sorbet",
            "ultra",
            "ink",
            "gold",
            "porcelain"
        ];
        return n[i];
    }

    /** body gradient: light, dark */
    function bodyColors(uint256 i) internal pure returns (string memory, string memory) {
        string[8] memory light = [
            "#b8ffd9",
            "#ffd6ec",
            "#9fe8ff",
            "#ffe1a8",
            "#d3c4ff",
            "#8a93a8",
            "#ffe89a",
            "#ffffff"
        ];
        string[8] memory dark = [
            "#25c07a",
            "#e8558f",
            "#2f8fd0",
            "#e08b2f",
            "#6f4fd8",
            "#1b2030",
            "#c99414",
            "#c8d4de"
        ];
        return (light[i], dark[i]);
    }

    function eyesName(uint256 i) internal pure returns (string memory) {
        string[6] memory n = ["dot", "wide", "sleepy", "wink", "starry", "visor"];
        return n[i];
    }

    function eyesSVG(uint256 i) internal pure returns (string memory) {
        if (i == 0) {
            return
                '<circle cx="270" cy="380" r="16"/><circle cx="370" cy="380" r="16"/>';
        }
        if (i == 1) {
            return
                '<circle cx="268" cy="378" r="26" fill="#fff"/><circle cx="372" cy="378" r="26" fill="#fff"/>'
                '<circle cx="274" cy="382" r="12"/><circle cx="378" cy="382" r="12"/>';
        }
        if (i == 2) {
            return
                '<path d="M244 382q26 22 52 0" fill="none" stroke="#101913" stroke-width="9" stroke-linecap="round"/>'
                '<path d="M344 382q26 22 52 0" fill="none" stroke="#101913" stroke-width="9" stroke-linecap="round"/>';
        }
        if (i == 3) {
            return
                '<circle cx="270" cy="380" r="16"/>'
                '<path d="M344 380q26-22 52 0" fill="none" stroke="#101913" stroke-width="9" stroke-linecap="round"/>';
        }
        if (i == 4) {
            return
                '<path d="M270 356l9 20 22 4-16 15 4 22-19-11-19 11 4-22-16-15 22-4z"/>'
                '<path d="M374 356l9 20 22 4-16 15 4 22-19-11-19 11 4-22-16-15 22-4z"/>';
        }
        return
            '<rect x="232" y="358" width="176" height="44" rx="22" fill="#101913" opacity="0.92"/>'
            '<rect x="248" y="372" width="52" height="14" rx="7" fill="#8affc8" opacity="0.9"/>';
    }

    function mouthName(uint256 i) internal pure returns (string memory) {
        string[5] memory n = ["smile", "plop", "smirk", "gasp", "flat"];
        return n[i];
    }

    function mouthSVG(uint256 i) internal pure returns (string memory) {
        if (i == 0) {
            return
                '<path d="M288 428q32 30 64 0" fill="none" stroke="#101913" stroke-width="10" stroke-linecap="round"/>';
        }
        if (i == 1) {
            return '<ellipse cx="320" cy="436" rx="20" ry="24" fill="#101913"/>';
        }
        if (i == 2) {
            return
                '<path d="M292 434q34 16 58-6" fill="none" stroke="#101913" stroke-width="10" stroke-linecap="round"/>';
        }
        if (i == 3) {
            return '<circle cx="320" cy="436" r="18" fill="#101913"/>';
        }
        return
            '<path d="M292 434h56" fill="none" stroke="#101913" stroke-width="10" stroke-linecap="round"/>';
    }

    function auraName(uint256 i) internal pure returns (string memory) {
        string[4] memory n = ["none", "glow", "ring", "halo"];
        return n[i];
    }

    function auraSVG(uint256 i, string memory tint) internal pure returns (string memory) {
        if (i == 1) {
            return
                string.concat(
                    '<circle cx="320" cy="400" r="230" fill="',
                    tint,
                    '" opacity="0.18" filter="url(#soft)"/>'
                );
        }
        if (i == 2) {
            return
                string.concat(
                    '<circle cx="320" cy="400" r="238" fill="none" stroke="',
                    tint,
                    '" stroke-width="6" opacity="0.65"/>'
                );
        }
        if (i == 3) {
            return
                string.concat(
                    '<ellipse cx="320" cy="132" rx="104" ry="26" fill="none" stroke="',
                    tint,
                    '" stroke-width="12" opacity="0.95" filter="url(#soft)"/>'
                    '<ellipse cx="320" cy="132" rx="104" ry="26" fill="none" stroke="',
                    tint,
                    '" stroke-width="7"/>'
                );
        }
        return "";
    }

    function sparklesSVG(uint256 count, uint256 seed) internal pure returns (string memory out) {
        string[6] memory scales = ["0.4", "0.6", "0.8", "1", "1.3", "1.7"];
        for (uint256 i = 0; i < count; i++) {
            uint256 s = uint256(keccak256(abi.encodePacked(seed, i)));
            out = string.concat(
                out,
                '<g transform="translate(',
                _str(60 + (s % 520)),
                " ",
                _str(60 + ((s >> 32) % 560)),
                ") scale(",
                scales[(s >> 64) % 6],
                ')"><path d="M0 -14Q3 -3 14 0Q3 3 0 14Q-3 3-14 0Q-3 -3 0 -14z" fill="#ffffff" opacity="0.85"/></g>'
            );
        }
    }

    /** The full artwork. Public so a marketplace, a wallet, or the mint page can render it raw. */
    function tokenSVG(uint256 tokenId) public view returns (string memory) {
        require(tokenId > 0 && tokenId <= MAX_SUPPLY, "bad id");
        Traits memory t = traitsOf(tokenId);
        return string.concat(_defs(t), _scene(t, tokenId), _face(t, tokenId));
    }

    function _defs(Traits memory t) internal pure returns (string memory) {
        (string memory bgIn, string memory bgOut) = backdropColors(t.backdrop);
        (string memory bodyLight, string memory bodyDark) = bodyColors(t.body);
        return
            string.concat(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 700" width="640" height="700">'
                "<defs>"
                '<radialGradient id="bg" cx="50%" cy="42%" r="72%"><stop offset="0" stop-color="',
                bgIn,
                '"/><stop offset="1" stop-color="',
                bgOut,
                '"/></radialGradient>'
                '<linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="',
                bodyLight,
                '"/><stop offset="1" stop-color="',
                bodyDark,
                '"/></linearGradient>'
                '<filter id="soft"><feGaussianBlur stdDeviation="12"/></filter>'
                "</defs>"
            );
    }

    function _scene(Traits memory t, uint256 tokenId) internal view returns (string memory) {
        (, string memory bodyDark) = bodyColors(t.body);
        return
            string.concat(
                '<rect width="640" height="700" fill="url(#bg)"/>',
                sparklesSVG(t.sparkles, seedOf(tokenId)),
                auraSVG(t.aura, bodyDark),
                // the droplet: a point at the top falling into a round belly
                '<path d="M320 118C398 250 470 330 470 404a150 150 0 0 1-300 0c0-74 72-154 150-286z" fill="url(#body)"/>'
                '<ellipse cx="252" cy="330" rx="34" ry="48" fill="#ffffff" opacity="0.35" transform="rotate(-18 252 330)"/>'
            );
    }

    function _face(Traits memory t, uint256 tokenId) internal pure returns (string memory) {
        return
            string.concat(
                '<g fill="#101913">',
                eyesSVG(t.eyes),
                mouthSVG(t.mouth),
                "</g>"
                '<text x="320" y="640" font-family="ui-monospace,monospace" font-size="34" fill="#101913" opacity="0.72" text-anchor="middle">plops #',
                _str(tokenId),
                "</text></svg>"
            );
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Traits memory t = traitsOf(tokenId);

        string memory attributes = string.concat(
            '[{"trait_type":"Backdrop","value":"',
            backdropName(t.backdrop),
            '"},{"trait_type":"Body","value":"',
            bodyName(t.body),
            '"},{"trait_type":"Eyes","value":"',
            eyesName(t.eyes),
            '"},{"trait_type":"Mouth","value":"',
            mouthName(t.mouth),
            '"},{"trait_type":"Aura","value":"',
            auraName(t.aura),
            '"},{"trait_type":"Sparkles","value":',
            _str(t.sparkles),
            "}]"
        );

        string memory json = string.concat(
            '{"name":"plops #',
            _str(tokenId),
            '","description":"1500 droplets born on Robinhood Chain. Art and metadata live entirely inside the contract - no IPFS, no server, no reveal.","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(tokenSVG(tokenId))),
            '","attributes":',
            attributes,
            "}"
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    /** Collection-level metadata, read by OpenSea to name the collection and set the fee. */
    function contractURI() external view returns (string memory) {
        string memory json = string.concat(
            '{"name":"plops genesis","description":"1500 fully on-chain droplets from the plops launchpad on Robinhood Chain.","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(tokenSVG(1))),
            '","seller_fee_basis_points":500,"fee_recipient":"',
            _hexAddress(owner()),
            '"}'
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ------------------------------------------------------- string helpers
    // Hand-rolled so the contract does not pull in OpenZeppelin's `Strings`, whose `Bytes`
    // dependency needs the cancun `mcopy` opcode.

    function _str(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 digits;
        for (uint256 v = value; v != 0; v /= 10) digits++;
        bytes memory buf = new bytes(digits);
        for (uint256 v = value; v != 0; v /= 10) buf[--digits] = bytes1(uint8(48 + (v % 10)));
        return string(buf);
    }

    function _hexAddress(address addr) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory buf = new bytes(42);
        buf[0] = "0";
        buf[1] = "x";
        uint160 v = uint160(addr);
        for (uint256 i = 41; i > 1; i--) {
            buf[i] = hexChars[v & 0xf];
            v >>= 4;
        }
        return string(buf);
    }
}
