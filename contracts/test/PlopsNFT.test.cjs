const { expect } = require("chai");
const { ethers } = require("hardhat");

const PRICE = ethers.parseEther("0.01");

async function deploy() {
  const [owner, buyer, other] = await ethers.getSigners();
  const nft = await (await ethers.getContractFactory("PlopsNFT")).deploy(owner.address);
  await nft.waitForDeployment();
  return { nft, owner, buyer, other };
}

function decodeDataURI(uri, prefix) {
  expect(uri.startsWith(prefix)).to.equal(true, `expected ${prefix}`);
  return Buffer.from(uri.slice(prefix.length), "base64").toString("utf8");
}

describe("PlopsNFT", function () {
  it("exposes the collection shape", async function () {
    const { nft } = await deploy();
    expect(await nft.name()).to.equal("plops genesis");
    expect(await nft.symbol()).to.equal("PLOPS");
    expect(await nft.MAX_SUPPLY()).to.equal(1500n);
    expect(await nft.PRICE()).to.equal(PRICE);
    expect(await nft.totalMinted()).to.equal(0n);
  });

  it("mints at 0.01 ETH each and rejects wrong payment", async function () {
    const { nft, buyer } = await deploy();
    await expect(nft.connect(buyer).mint(3, { value: PRICE * 3n }))
      .to.emit(nft, "Minted")
      .withArgs(buyer.address, 1n, PRICE);
    expect(await nft.totalMinted()).to.equal(3n);
    expect(await nft.balanceOf(buyer.address)).to.equal(3n);
    expect(await ethers.provider.getBalance(await nft.getAddress())).to.equal(PRICE * 3n);

    await expect(nft.connect(buyer).mint(1, { value: PRICE - 1n })).to.be.revertedWith(
      "wrong value",
    );
    await expect(nft.connect(buyer).mint(0, { value: 0 })).to.be.revertedWith("bad quantity");
    await expect(nft.connect(buyer).mint(11, { value: PRICE * 11n })).to.be.revertedWith(
      "bad quantity",
    );
  });

  it("stops at 1500", async function () {
    const { nft, buyer } = await deploy();
    for (let i = 0; i < 150; i++) {
      await nft.connect(buyer).mint(10, { value: PRICE * 10n });
    }
    expect(await nft.totalMinted()).to.equal(1500n);
    await expect(nft.connect(buyer).mint(1, { value: PRICE })).to.be.revertedWith("sold out");
  });

  it("lets only the owner withdraw proceeds", async function () {
    const { nft, owner, buyer, other } = await deploy();
    await nft.connect(buyer).mint(2, { value: PRICE * 2n });
    await expect(nft.connect(buyer).withdraw(buyer.address)).to.be.revertedWithCustomError(
      nft,
      "OwnableUnauthorizedAccount",
    );
    const before = await ethers.provider.getBalance(other.address);
    await nft.connect(owner).withdraw(other.address);
    expect(await ethers.provider.getBalance(other.address)).to.equal(before + PRICE * 2n);
    expect(await ethers.provider.getBalance(await nft.getAddress())).to.equal(0n);
  });

  it("reports a 5% royalty and the marketplace interfaces", async function () {
    const { nft, owner } = await deploy();
    const [receiver, amount] = await nft.royaltyInfo(1, ethers.parseEther("1"));
    expect(receiver).to.equal(owner.address);
    expect(amount).to.equal(ethers.parseEther("0.05"));
    expect(await nft.supportsInterface("0x80ac58cd")).to.equal(true); // ERC721
    expect(await nft.supportsInterface("0x5b5e139f")).to.equal(true); // ERC721Metadata
    expect(await nft.supportsInterface("0x2a55205a")).to.equal(true); // ERC2981
  });

  it("renders on-chain pixel art and metadata", async function () {
    const { nft, buyer } = await deploy();
    await nft.connect(buyer).mint(1, { value: PRICE });

    const svg = await nft.tokenSVG(1);
    expect(svg.startsWith("<svg")).to.equal(true);
    expect(svg.endsWith("</svg>")).to.equal(true);
    expect(svg).to.contain("plops #1");
    expect(svg).to.contain('shape-rendering="crispEdges"');
    expect((svg.match(/<rect /g) ?? []).length).to.be.greaterThan(10); // backdrop + pixel blocks

    const meta = JSON.parse(
      decodeDataURI(await nft.tokenURI(1), "data:application/json;base64,"),
    );
    expect(meta.name).to.equal("plops #1");
    expect(meta.image.startsWith("data:image/svg+xml;base64,")).to.equal(true);
    expect(meta.attributes.map((a) => a.trait_type)).to.deep.equal([
      "Backdrop",
      "Body",
      "Ears",
      "Mouth",
      "Extra",
    ]);

    const collection = JSON.parse(
      decodeDataURI(await nft.contractURI(), "data:application/json;base64,"),
    );
    expect(collection.name).to.equal("plops genesis");
    expect(collection.seller_fee_basis_points).to.equal(500);
  });

  it("keeps collection metadata in step with the royalty in force", async function () {
    const { nft, owner, other } = await deploy();
    await nft.connect(owner).setRoyalty(other.address, 250);
    const collection = JSON.parse(
      decodeDataURI(await nft.contractURI(), "data:application/json;base64,"),
    );
    expect(collection.seller_fee_basis_points).to.equal(250);
    expect(collection.fee_recipient).to.equal(other.address.toLowerCase());
  });

  it("draws a different plop for every token", async function () {
    const { nft } = await deploy();
    const art = new Set();
    for (const id of [1, 2, 3, 42, 777, 1500]) art.add(await nft.tokenSVG(id));
    expect(art.size).to.equal(6);
  });

  it("keeps art previewable before the mint and fixed afterwards", async function () {
    const { nft, buyer } = await deploy();
    const preview = await nft.tokenSVG(777);
    await expect(nft.tokenURI(777)).to.be.revertedWithCustomError(nft, "ERC721NonexistentToken");
    for (let i = 0; i < 78; i++) {
      await nft.connect(buyer).mint(10, { value: PRICE * 10n });
    }
    expect(await nft.tokenSVG(777)).to.equal(preview);
    await expect(nft.tokenSVG(0)).to.be.revertedWith("bad id");
    await expect(nft.tokenSVG(1501)).to.be.revertedWith("bad id");
  });

  it("spreads traits across the collection", async function () {
    const { nft } = await deploy();
    const seen = {
      backdrop: new Set(),
      body: new Set(),
      ears: new Set(),
      mouth: new Set(),
      extra: new Set(),
    };
    for (let id = 1; id <= 120; id++) {
      const t = await nft.traitsOf(id);
      seen.backdrop.add(t.backdrop);
      seen.body.add(t.body);
      seen.ears.add(t.ears);
      seen.mouth.add(t.mouth);
      seen.extra.add(t.extra);
    }
    expect(seen.backdrop.size).to.equal(6);
    expect(seen.body.size).to.equal(8);
    expect(seen.ears.size).to.equal(4);
    expect(seen.mouth.size).to.equal(4);
    expect(seen.extra.size).to.equal(4);
  });
});
