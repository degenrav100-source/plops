const { expect } = require("chai");
const { ethers } = require("hardhat");

const META = {
  description: "Indexed by the factory",
  imageURI: "ipfs://img",
  twitter: "https://x.com/plops",
  telegram: "https://t.me/plops",
  website: "https://plopspad.xyz",
};

async function deployFactory() {
  const [deployer, alice, bob] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("PlopsFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  return { factory, deployer, alice, bob };
}

async function launch(factory, signer, symbol, value = 0n) {
  const tx = await factory.connect(signer).launch(`${symbol} coin`, symbol, META, { value });
  const receipt = await tx.wait();
  const log = receipt.logs.find((l) => {
    try {
      return factory.interface.parseLog(l)?.name === "TokenLaunched";
    } catch {
      return false;
    }
  });
  return factory.interface.parseLog(log).args;
}

describe("PlopsFactory", () => {
  it("launches a token, indexes it and emits TokenLaunched", async () => {
    const { factory, alice } = await deployFactory();
    const args = await launch(factory, alice, "AAA");

    expect(args.creator).to.equal(alice.address);
    expect(args.symbol).to.equal("AAA");
    expect(args.imageURI).to.equal(META.imageURI);
    expect(await factory.tokensCount()).to.equal(1n);
    expect(await factory.tokens(0)).to.equal(args.token);
    expect(await factory.isPlopsToken(args.token)).to.equal(true);

    const token = await ethers.getContractAt("PlopsBondingToken", args.token);
    expect(await token.symbol()).to.equal("AAA");
    // the launcher, not the factory, owns the curve fees
    expect(await token.creator()).to.equal(alice.address);
  });

  it("forwards the seed buy to the new curve and keeps no ETH", async () => {
    const { factory, alice } = await deployFactory();
    const value = ethers.parseEther("0.2");
    const args = await launch(factory, alice, "SEED", value);

    const token = await ethers.getContractAt("PlopsBondingToken", args.token);
    expect(args.initialBuy).to.equal(value);
    expect(args.quote).to.equal(ethers.ZeroAddress);
    expect(await factory.quoteOf(args.token)).to.equal(ethers.ZeroAddress);
    expect(await token.balanceOf(alice.address)).to.be.gt(0n);
    expect(await ethers.provider.getBalance(await factory.getAddress())).to.equal(0n);
  });

  it("pages the index and returns newest first", async () => {
    const { factory, alice, bob } = await deployFactory();
    const a = await launch(factory, alice, "AAA");
    const b = await launch(factory, bob, "BBB");
    const c = await launch(factory, alice, "CCC");

    expect(await factory.tokensCount()).to.equal(3n);
    expect(await factory.tokensSlice(1, 2)).to.deep.equal([b.token, c.token]);
    expect(await factory.latestTokens(2)).to.deep.equal([c.token, b.token]);
    // clamped rather than reverting
    expect(await factory.tokensSlice(0, 1000)).to.deep.equal([a.token, b.token, c.token]);
    expect(await factory.tokensSlice(9, 5)).to.deep.equal([]);
    expect(await factory.latestTokens(1000)).to.deep.equal([c.token, b.token, a.token]);
    expect(await factory.creatorTokens(alice.address)).to.deep.equal([a.token, c.token]);
  });

  it("launches a stock-quoted curve, seeds it and keeps no funds", async () => {
    const { factory, alice } = await deployFactory();
    const Stock = await ethers.getContractFactory("MockStock");
    const stock = await Stock.deploy("Apple - Robinhood Token", "AAPL");
    await stock.waitForDeployment();
    const stockAddr = await stock.getAddress();

    const seed = ethers.parseEther("2"); // 2 AAPL
    await stock.mint(alice.address, seed);
    await stock.connect(alice).approve(await factory.getAddress(), seed);

    const tx = await factory
      .connect(alice)
      .launchWithQuote("Apple Plops", "APLOP", stockAddr, ethers.parseEther("1"), seed, META);
    const receipt = await tx.wait();
    const args = factory.interface.parseLog(
      receipt.logs.find((l) => {
        try {
          return factory.interface.parseLog(l)?.name === "TokenLaunched";
        } catch {
          return false;
        }
      }),
    ).args;

    expect(args.quote).to.equal(stockAddr);
    expect(args.initialBuy).to.equal(seed);
    expect(await factory.quoteOf(args.token)).to.equal(stockAddr);
    expect(await factory.isPlopsToken(args.token)).to.equal(true);

    const token = await ethers.getContractAt("PlopsQuotedToken", args.token);
    // the creator, not the factory, holds the seed buy and the fee
    expect(await token.balanceOf(alice.address)).to.be.gt(0n);
    expect(await token.balanceOf(await factory.getAddress())).to.equal(0n);
    expect(await stock.balanceOf(await factory.getAddress())).to.equal(0n);
    expect(await stock.allowance(await factory.getAddress(), args.token)).to.equal(0n);
    // 1% fee went back to the creator, the rest sits in the curve
    expect(await stock.balanceOf(alice.address)).to.equal(seed / 100n);
    expect(await token.realQuoteReserve()).to.equal(seed - seed / 100n);
  });

  it("launches a stock-quoted curve without a seed buy", async () => {
    const { factory, alice } = await deployFactory();
    const Stock = await ethers.getContractFactory("MockStock");
    const stock = await Stock.deploy("Tesla - Robinhood Token", "TSLA");
    await stock.waitForDeployment();

    await factory
      .connect(alice)
      .launchWithQuote("Tesla Plops", "TPLOP", await stock.getAddress(), ethers.parseEther("1"), 0n, META);

    const token = await ethers.getContractAt("PlopsQuotedToken", await factory.tokens(0));
    expect(await token.tokenReserve()).to.equal(await token.TOTAL_SUPPLY());
    expect(await token.realQuoteReserve()).to.equal(0n);
  });

  it("does not vouch for tokens deployed outside the factory", async () => {
    const { factory, alice } = await deployFactory();
    const Token = await ethers.getContractFactory("PlopsBondingToken");
    const rogue = await Token.deploy("Rogue", "RGE", alice.address, META);
    await rogue.waitForDeployment();
    expect(await factory.isPlopsToken(await rogue.getAddress())).to.equal(false);
  });
});
