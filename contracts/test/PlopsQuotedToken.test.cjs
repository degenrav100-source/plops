const { expect } = require("chai");
const { ethers } = require("hardhat");

const META = {
  description: "Priced in a tokenized stock",
  imageURI: "ipfs://img",
  twitter: "",
  telegram: "",
  website: "",
};

const ONE = ethers.parseEther("1");

async function deployAll() {
  const [creator, alice, bob] = await ethers.getSigners();
  const Stock = await ethers.getContractFactory("MockStock");
  const stock = await Stock.deploy("Apple - Robinhood Token", "AAPL");
  await stock.waitForDeployment();

  const Token = await ethers.getContractFactory("PlopsQuotedToken");
  const token = await Token.deploy(
    "Apple Plops",
    "APLOP",
    creator.address,
    await stock.getAddress(),
    ONE,
    META,
  );
  await token.waitForDeployment();

  for (const s of [alice, bob]) {
    await stock.mint(s.address, ethers.parseEther("100"));
    await stock.connect(s).approve(await token.getAddress(), ethers.MaxUint256);
  }
  return { stock, token, creator, alice, bob };
}

describe("PlopsQuotedToken", () => {
  it("mints the whole supply to the curve and starts at the virtual price", async () => {
    const { token, stock } = await deployAll();
    expect(await token.balanceOf(await token.getAddress())).to.equal(await token.TOTAL_SUPPLY());
    expect(await token.tokenReserve()).to.equal(await token.TOTAL_SUPPLY());
    expect(await token.quoteReserve()).to.equal(ONE);
    expect(await token.realQuoteReserve()).to.equal(0n);
    expect(await stock.balanceOf(await token.getAddress())).to.equal(0n);
  });

  it("buys along the curve, pays the creator fee in the quote asset", async () => {
    const { token, stock, creator, alice } = await deployAll();
    const spend = ethers.parseEther("1"); // 1 AAPL
    const [expected, fee] = await token.quoteBuy(spend);

    await expect(token.connect(alice).buy(spend, expected)).to.emit(token, "Trade");

    expect(await token.balanceOf(alice.address)).to.equal(expected);
    expect(await stock.balanceOf(creator.address)).to.equal(fee);
    expect(await stock.balanceOf(await token.getAddress())).to.equal(spend - fee);
    expect(await token.realQuoteReserve()).to.equal(spend - fee);
    expect(fee).to.equal(spend / 100n);
  });

  it("reverts a buy that would fall short of minTokensOut", async () => {
    const { token, alice } = await deployAll();
    const spend = ethers.parseEther("1");
    const [expected] = await token.quoteBuy(spend);
    await expect(token.connect(alice).buy(spend, expected + 1n)).to.be.revertedWith("slippage");
  });

  it("sells back for the quote asset and never overdraws the reserve", async () => {
    const { token, stock, alice, bob } = await deployAll();
    await token.connect(alice).buy(ethers.parseEther("5"), 0);
    await token.connect(bob).buy(ethers.parseEther("3"), 0);

    const amount = await token.balanceOf(bob.address);
    const before = await stock.balanceOf(bob.address);
    const [out] = await token.quoteSell(amount);

    await token.connect(bob).sell(amount, out);

    expect(await stock.balanceOf(bob.address)).to.equal(before + out);
    expect(await token.balanceOf(bob.address)).to.equal(0n);
    // the curve still covers its own accounting
    expect(await stock.balanceOf(await token.getAddress())).to.be.gte(await token.realQuoteReserve());
  });

  it("lets every holder exit even when they all sell", async () => {
    const { token, stock, alice, bob } = await deployAll();
    await token.connect(alice).buy(ethers.parseEther("10"), 0);
    await token.connect(bob).buy(ethers.parseEther("7"), 0);

    await token.connect(bob).sell(await token.balanceOf(bob.address), 0);
    await token.connect(alice).sell(await token.balanceOf(alice.address), 0);

    expect(await token.tokenReserve()).to.equal(await token.TOTAL_SUPPLY());
    expect(await stock.balanceOf(await token.getAddress())).to.be.gte(0n);
    expect(await token.quoteReserve()).to.be.gte(ONE);
  });

  it("ignores donated quote tokens when pricing", async () => {
    const { token, stock, alice, bob } = await deployAll();
    const [expected] = await token.quoteBuy(ONE);
    await stock.connect(bob).transfer(await token.getAddress(), ethers.parseEther("50"));
    const [afterDonation] = await token.quoteBuy(ONE);
    expect(afterDonation).to.equal(expected);
    await token.connect(alice).buy(ONE, expected);
    expect(await token.balanceOf(alice.address)).to.equal(expected);
  });

  it("credits buyFor to the recipient, not the payer", async () => {
    const { token, alice, bob } = await deployAll();
    await token.connect(alice).buyFor(bob.address, ONE, 0);
    expect(await token.balanceOf(bob.address)).to.be.gt(0n);
    expect(await token.balanceOf(alice.address)).to.equal(0n);
  });

  it("rejects a zero quote asset or zero virtual reserve", async () => {
    const [creator] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("PlopsQuotedToken");
    await expect(
      Token.deploy("X", "X", creator.address, ethers.ZeroAddress, ONE, META),
    ).to.be.revertedWith("quote=0");
    const Stock = await ethers.getContractFactory("MockStock");
    const stock = await Stock.deploy("S", "S");
    await expect(
      Token.deploy("X", "X", creator.address, await stock.getAddress(), 0n, META),
    ).to.be.revertedWith("virtual=0");
  });
});
