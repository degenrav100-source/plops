// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/**
 * The plops genesis collection: 1500 pixel plops, 0.01 ETH each, art and metadata generated inside
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
        _mintTo(msg.sender, quantity);
    }

    function mintTo(address to, uint256 quantity) external payable nonReentrant {
        _mintTo(to, quantity);
    }

    function _mintTo(address to, uint256 quantity) private {
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
    //
    // Every plop is the pixel logo redrawn on a 12x12 grid: same silhouette family, different
    // ears, colours, eyes, mouth and extras. The grid is filled cell by cell, then emitted as
    // one <rect> per horizontal run of the same colour.

    uint256 private constant GRID = 12;
    uint256 private constant CELL = 48;

    /** Deterministic per-token entropy: the same for every caller, known before the mint. */
    function seedOf(uint256 tokenId) public view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(address(this), tokenId)));
    }

    struct Traits {
        uint256 backdrop;
        uint256 body;
        uint256 ears;
        uint256 eyes;
        uint256 mouth;
        uint256 extra;
    }

    function traitsOf(uint256 tokenId) public view returns (Traits memory t) {
        uint256 s = seedOf(tokenId);
        t.backdrop = (s >> 8) % 6;
        t.body = (s >> 24) % 8;
        t.ears = (s >> 36) % 4;
        t.eyes = (s >> 48) % 6;
        t.mouth = (s >> 60) % 4;
        // extras are the rarity axis: ~55% none, blush, sparkles, and a 7% crown
        uint256 e = (s >> 72) % 100;
        t.extra = e < 55 ? 0 : e < 78 ? 1 : e < 93 ? 2 : 3;
    }

    function backdropName(uint256 i) internal pure returns (string memory) {
        string[6] memory n = ["paper", "mist", "lagoon", "bubblegum", "midnight", "sherbet"];
        return n[i];
    }

    function backdropColor(uint256 i) internal pure returns (string memory) {
        string[6] memory c = ["#f7f7f2", "#e8f3ff", "#dcfbee", "#ffe6f4", "#0d1220", "#ffeedd"];
        return c[i];
    }

    function bodyName(uint256 i) internal pure returns (string memory) {
        string[8] memory n = [
            "plops green",
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

    /** body colour, its shadow, and the accent used by extras */
    function bodyColors(uint256 i)
        internal
        pure
        returns (string memory fill, string memory shade, string memory accent)
    {
        string[8] memory f = [
            "#4caf50",
            "#f489bd",
            "#3ea6dd",
            "#f0a94a",
            "#8f6cf2",
            "#232a3a",
            "#e3b93d",
            "#e9eef2"
        ];
        string[8] memory sh = [
            "#2f8a3a",
            "#cf5f96",
            "#2a7cab",
            "#c47f27",
            "#6746c4",
            "#12161f",
            "#b38c1c",
            "#b9c4cc"
        ];
        string[8] memory ac = [
            "#a5f3b6",
            "#ffd7ea",
            "#bdeaff",
            "#ffdca8",
            "#d6c9ff",
            "#8affc8",
            "#fff0b0",
            "#ffffff"
        ];
        return (f[i], sh[i], ac[i]);
    }

    function earsName(uint256 i) internal pure returns (string memory) {
        string[4] memory n = ["classic", "wide", "bent", "antenna"];
        return n[i];
    }

    function eyesName(uint256 i) internal pure returns (string memory) {
        string[6] memory n = ["dot", "wide", "wink", "visor", "sleepy", "starry"];
        return n[i];
    }

    function mouthName(uint256 i) internal pure returns (string memory) {
        string[4] memory n = ["none", "smile", "plop", "fang"];
        return n[i];
    }

    function extraName(uint256 i) internal pure returns (string memory) {
        string[4] memory n = ["none", "blush", "sparkles", "crown"];
        return n[i];
    }

    /**
     * The plops mark at 2x: the logo pixels themselves, one character per cell (`.` empty,
     * `b` body). Only the ear rows change between variants, so the silhouette always reads
     * as the same logo.
     */
    function _silhouette(uint256 ears) internal pure returns (string[12] memory rows) {
        rows = [
            "....bb....bb",
            "....bb....bb",
            "....bb....bb",
            "....bb....bb",
            "bb..bbbbbbbb",
            "bb..bbbbbbbb",
            "..bbbbbbbbbb",
            "..bbbbbbbbbb",
            "......bbbb..",
            "......bbbb..",
            "......bbbb..",
            "......bbbb.."
        ];
        if (ears == 1) {
            rows[0] = "...bbb...bbb";
            rows[1] = "...bbb...bbb";
            rows[2] = "...bbb...bbb";
            rows[3] = "...bbb...bbb";
        } else if (ears == 2) {
            rows[0] = "...bb.....bb";
        } else if (ears == 3) {
            rows[0] = ".....b.....b";
            rows[1] = ".....b.....b";
        }
    }

    /** Grid of colour keys: `.` backdrop, `b` body, `s` shade, `k` ink, `w` white, `a` accent. */
    function _grid(Traits memory t) internal pure returns (bytes memory g) {
        string[12] memory rows = _silhouette(t.ears);
        g = new bytes(GRID * GRID);
        for (uint256 y = 0; y < GRID; y++) {
            bytes memory row = bytes(rows[y]);
            for (uint256 x = 0; x < GRID; x++) g[y * GRID + x] = row[x];
        }

        // one darker column and row along the light-facing edges, so the block reads as volume
        for (uint256 y = 0; y < GRID; y++) {
            for (uint256 x = 0; x < GRID; x++) {
                if (g[y * GRID + x] != "b") continue;
                bool edgeRight = x + 1 == GRID || g[y * GRID + x + 1] == ".";
                bool edgeDown = y + 1 == GRID || g[(y + 1) * GRID + x] == ".";
                if (edgeRight || edgeDown) g[y * GRID + x] = "s";
            }
        }

        _paintEyes(g, t.eyes);
        _paintMouth(g, t.mouth);
        _paintExtra(g, t.extra);
    }

    function _set(bytes memory g, uint256 x, uint256 y, bytes1 key) private pure {
        uint256 i = y * GRID + x;
        if (i < g.length) g[i] = key;
    }

    function _paintEyes(bytes memory g, uint256 eyes) private pure {
        if (eyes == 0) {
            _set(g, 5, 5, "k");
            _set(g, 9, 5, "k");
        } else if (eyes == 1) {
            _set(g, 5, 5, "k");
            _set(g, 9, 5, "k");
            _set(g, 5, 6, "k");
            _set(g, 9, 6, "k");
        } else if (eyes == 2) {
            _set(g, 5, 5, "k");
            _set(g, 9, 6, "k");
        } else if (eyes == 3) {
            for (uint256 x = 4; x <= 10; x++) _set(g, x, 5, "k");
            _set(g, 5, 5, "a");
        } else if (eyes == 4) {
            _set(g, 5, 6, "k");
            _set(g, 9, 6, "k");
        } else {
            _set(g, 5, 5, "k");
            _set(g, 9, 5, "k");
            _set(g, 4, 4, "a");
            _set(g, 10, 4, "a");
        }
    }

    function _paintMouth(bytes memory g, uint256 mouth) private pure {
        if (mouth == 1) {
            _set(g, 7, 7, "k");
            _set(g, 8, 7, "k");
        } else if (mouth == 2) {
            _set(g, 7, 7, "k");
            _set(g, 8, 7, "k");
            _set(g, 7, 8, "k");
            _set(g, 8, 8, "k");
        } else if (mouth == 3) {
            _set(g, 7, 7, "k");
            _set(g, 8, 7, "k");
            _set(g, 7, 8, "w");
        }
    }

    function _paintExtra(bytes memory g, uint256 extra) private pure {
        if (extra == 1) {
            _set(g, 4, 6, "a");
            _set(g, 10, 6, "a");
        } else if (extra == 2) {
            _set(g, 1, 0, "a");
            _set(g, 1, 2, "a");
            _set(g, 2, 9, "a");
            _set(g, 11, 10, "a");
        } else if (extra == 3) {
            _set(g, 6, 0, "a");
            _set(g, 7, 0, "a");
            _set(g, 8, 0, "a");
            _set(g, 7, 1, "a");
        }
    }

    function _colorOf(bytes1 key, Traits memory t) private pure returns (string memory) {
        (string memory fill, string memory shade, string memory accent) = bodyColors(t.body);
        if (key == "b") return fill;
        if (key == "s") return shade;
        if (key == "k") return t.body == 5 ? "#e9eef2" : "#101913"; // ink bodies need light eyes
        if (key == "w") return "#ffffff";
        if (key == "a") return accent;
        return "";
    }

    /** One <rect> per run of identical cells; empty cells fall through to the backdrop. */
    function _pixels(Traits memory t) internal pure returns (string memory out) {
        bytes memory g = _grid(t);
        for (uint256 y = 0; y < GRID; y++) {
            uint256 x = 0;
            while (x < GRID) {
                bytes1 key = g[y * GRID + x];
                uint256 run = 1;
                while (x + run < GRID && g[y * GRID + x + run] == key) run++;
                if (key != ".") {
                    out = string.concat(
                        out,
                        '<rect x="',
                        _str(32 + x * CELL),
                        '" y="',
                        _str(32 + y * CELL),
                        '" width="',
                        _str(run * CELL),
                        '" height="',
                        _str(CELL),
                        '" fill="',
                        _colorOf(key, t),
                        '"/>'
                    );
                }
                x += run;
            }
        }
    }

    /** The full artwork. Public so a marketplace, a wallet, or the mint page can render it raw. */
    function tokenSVG(uint256 tokenId) public view returns (string memory) {
        require(tokenId > 0 && tokenId <= MAX_SUPPLY, "bad id");
        Traits memory t = traitsOf(tokenId);
        bool dark = t.backdrop == 4;
        return
            string.concat(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 700" width="640" height="700" shape-rendering="crispEdges">'
                '<rect width="640" height="700" fill="',
                backdropColor(t.backdrop),
                '"/>',
                _pixels(t),
                '<text x="320" y="666" font-family="ui-monospace,monospace" font-size="30" fill="',
                dark ? "#ffffff" : "#101913",
                '" opacity="0.7" text-anchor="middle">plops #',
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
            '"},{"trait_type":"Ears","value":"',
            earsName(t.ears),
            '"},{"trait_type":"Eyes","value":"',
            eyesName(t.eyes),
            '"},{"trait_type":"Mouth","value":"',
            mouthName(t.mouth),
            '"},{"trait_type":"Extra","value":"',
            extraName(t.extra),
            '"}]'
        );

        string memory json = string.concat(
            '{"name":"plops #',
            _str(tokenId),
            '","description":"Pixel plops: the plops mark redrawn on-chain, one of 1500, no two alike. Art and metadata live entirely inside the contract - no IPFS, no server, no reveal.","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(tokenSVG(tokenId))),
            '","attributes":',
            attributes,
            "}"
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    /** Collection-level metadata, read by OpenSea to name the collection and set the fee. */
    function contractURI() external view returns (string memory) {
        // read the royalty actually in force, so `setRoyalty` cannot leave this metadata stale
        (address receiver, uint256 feeBps) = royaltyInfo(1, 10_000);
        string memory json = string.concat(
            '{"name":"plops genesis","description":"1500 fully on-chain pixel plops from the plops launchpad on Robinhood Chain.","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(tokenSVG(1))),
            '","seller_fee_basis_points":',
            _str(feeBps),
            ',"fee_recipient":"',
            _hexAddress(receiver),
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
