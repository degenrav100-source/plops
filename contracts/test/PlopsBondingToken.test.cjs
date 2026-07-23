const { expect } = require("chai");
const { ethers } = require("hardhat");

const META = {
  description: "A dreamy test token",
  imageURI: "ipfs://img",
  twitter: "https://x.com/plops",
  telegram: "https://t.me/plops",
  website: "https://plopspad.xyz",
};

async function deploy(value = 0n) {
  const [creator, alice, bob] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("PlopsBondingToken");
  const token = await Factory.deploy("Plops Token", "PLOP", creator.address, META, { value });
  await token.waitForDeployment();
  return { token, creator, alice, bob };
}

describe("PlopsBondingToken", () => {
  it("mints the full supply to the curve and stores metadata", async () => {
    const { token, creator } = await deploy();
    const total = await token.TOTAL_SUPPLY();
    expect(await token.totalSupply()).to.equal(total);
    expect(await token.balanceOf(await token.getAddress())).to.equal(total);
    expect(await token.ethReserve()).to.equal(await token.VIRTUAL_ETH());
    expect(await token.realEthReserve()).to.equal(0n);
    expect(await token.creator()).to.equal(creator.address);
    expect(await token.description()).to.equal(META.description);
    expect(await token.imageURI()).to.equal(META.imageURI);
    expect(await token.twitter()).to.equal(META.twitter);
  });

  it("performs a creator seed buy when deployed with ETH", async () => {
    const { token, creator } = await deploy(ethers.parseEther("0.1"));
    expect(await token.balanceOf(creator.address)).to.be.gt(0n);
    expect(await token.ethReserve()).to.be.gt(await token.VIRTUAL_ETH());
  });

  it("buy() gives tokens matching quoteBuy and charges the fee", async () => {
    const { token, creator, alice } = await deploy();
    const ethIn = ethers.parseEther("0.5");
    const [quotedTokens, quotedFee] = await token.quoteBuy(ethIn);

    const creatorBefore = await ethers.provider.getBalance(creator.address);
    await expect(token.connect(alice).buy(0n, { value: ethIn }))
      .to.emit(token, "Trade");

    expect(await token.balanceOf(alice.address)).to.equal(quotedTokens);
    // creator receives the fee (creator != alice)
    const creatorAfter = await ethers.provider.getBalance(creator.address);
    expect(creatorAfter - creatorBefore).to.equal(quotedFee);
    // contract holds the real ETH used for the curve
    const contractBal = await ethers.provider.getBalance(await token.getAddress());
    expect(contractBal).to.equal(ethIn - quotedFee);
  });

  it("sell() returns ETH matching quoteSell (non-custodial round trip)", async () => {
    const { token, alice } = await deploy();
    const ethIn = ethers.parseEther("1");
    await token.connect(alice).buy(0n, { value: ethIn });
    const bal = await token.balanceOf(alice.address);

    const [ethOut] = await token.quoteSell(bal);
    expect(ethOut).to.be.gt(0n);

    const before = await ethers.provider.getBalance(alice.address);
    const tx = await token.connect(alice).sell(bal, 0n);
    const rcpt = await tx.wait();
    const gas = rcpt.gasUsed * rcpt.gasPrice;
    const after = await ethers.provider.getBalance(alice.address);

    expect(after - before + gas).to.equal(ethOut);
    expect(await token.balanceOf(alice.address)).to.equal(0n);
    // curve regained the tokens
    expect(await token.balanceOf(await token.getAddress())).to.equal(await token.TOTAL_SUPPLY());
  });

  it("keeps the contract solvent across many trades", async () => {
    const { token, alice, bob } = await deploy();
    await token.connect(alice).buy(0n, { value: ethers.parseEther("2") });
    await token.connect(bob).buy(0n, { value: ethers.parseEther("3") });
    await token.connect(alice).sell(await token.balanceOf(alice.address), 0n);
    await token.connect(bob).sell(await token.balanceOf(bob.address), 0n);
    // every seller was paid; residual real ETH stays non-negative
    const addr = await token.getAddress();
    expect(await ethers.provider.getBalance(addr)).to.be.gte(0n);
    expect(await token.realEthReserve()).to.be.gte(0n);
  });

  it("enforces buy slippage guard", async () => {
    const { token, alice } = await deploy();
    const ethIn = ethers.parseEther("0.5");
    const [quotedTokens] = await token.quoteBuy(ethIn);
    await expect(
      token.connect(alice).buy(quotedTokens + 1n, { value: ethIn }),
    ).to.be.revertedWith("slippage");
  });

  it("enforces sell slippage guard", async () => {
    const { token, alice } = await deploy();
    await token.connect(alice).buy(0n, { value: ethers.parseEther("1") });
    const bal = await token.balanceOf(alice.address);
    const [ethOut] = await token.quoteSell(bal);
    await expect(token.connect(alice).sell(bal, ethOut + 1n)).to.be.revertedWith("slippage");
  });

  it("rejects zero-value buys and empty sells", async () => {
    const { token, alice } = await deploy();
    await expect(token.connect(alice).buy(0n, { value: 0n })).to.be.revertedWith("no ETH");
    await expect(token.connect(alice).sell(0n, 0n)).to.be.revertedWith("no tokens");
  });
});
