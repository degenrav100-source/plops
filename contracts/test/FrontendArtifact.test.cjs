// Mirrors the exact call shape the frontend uses: it deploys from the compiled
// artifact (ABI + bytecode) with metadata passed as a POSITIONAL TUPLE ARRAY
// (as ethers encodes a struct arg from an array), then buys and sells.
const { expect } = require("chai");
const { ethers, artifacts } = require("hardhat");

// same positional order as the Solidity Metadata struct
const META_TUPLE = [
  "A dreamy test token", // description
  "ipfs://img", // imageURI
  "https://x.com/plops", // twitter
  "https://t.me/plops", // telegram
  "https://plopspad.xyz", // website
];

describe("Frontend deploy path (artifact + tuple args)", () => {
  it("deploys from ABI/bytecode with tuple metadata, then buys & sells", async () => {
    const [creator, alice] = await ethers.getSigners();
    const artifact = await artifacts.readArtifact("PlopsBondingToken");
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, creator);

    // deploy exactly like src/lib/token.ts deployToken()
    const token = await factory.deploy("Plops Token", "PLOP", creator.address, META_TUPLE, {
      value: ethers.parseEther("0.05"),
    });
    await token.waitForDeployment();

    expect(await token.description()).to.equal(META_TUPLE[0]);
    expect(await token.imageURI()).to.equal(META_TUPLE[1]);
    expect(await token.website()).to.equal(META_TUPLE[4]);
    // creator seed buy from the constructor value
    expect(await token.balanceOf(creator.address)).to.be.gt(0n);

    // buy() like buyToken()
    const ethIn = ethers.parseEther("0.1");
    const [quotedTokens] = await token.quoteBuy(ethIn);
    await token.connect(alice).buy(0n, { value: ethIn });
    expect(await token.balanceOf(alice.address)).to.equal(quotedTokens);

    // sell() like sellToken() — no approval needed
    const bal = await token.balanceOf(alice.address);
    const [quotedEth] = await token.quoteSell(bal);
    const before = await ethers.provider.getBalance(alice.address);
    const tx = await token.connect(alice).sell(bal, 0n);
    const rcpt = await tx.wait();
    const gas = rcpt.gasUsed * rcpt.gasPrice;
    const after = await ethers.provider.getBalance(alice.address);
    expect(after + gas - before).to.equal(quotedEth);
    expect(await token.balanceOf(alice.address)).to.equal(0n);
  });
});
