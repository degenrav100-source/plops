// The frontend predicts the plops genesis address before anything is signed, then deploys through
// Arachnid's deterministic-deployment proxy. This proves prediction and deployment agree, using the
// exact salt and init code src/lib/nft.ts builds.
const fs = require("node:fs");
const path = require("node:path");
const { expect } = require("chai");
const { ethers, artifacts } = require("hardhat");

const NFT_TS = fs.readFileSync(path.join(__dirname, "../../src/lib/nft.ts"), "utf8");
const CREATE2_DEPLOYER = /CREATE2_DEPLOYER = "(0x[0-9a-fA-F]{40})"/.exec(NFT_TS)[1];
const SALT_SEED = /NFT_SALT = id\("([^"]+)"\)/.exec(NFT_TS)[1];
const SALT = ethers.id(SALT_SEED);

// runtime code of the proxy: deploy calldata[32:] with CREATE2, salt = calldata[:32]
const PROXY_RUNTIME =
  "0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3";

async function initCode(owner) {
  const artifact = await artifacts.readArtifact("PlopsNFT");
  const args = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [owner]);
  return ethers.concat([artifact.bytecode, args]);
}

function predict(code) {
  return ethers.getCreate2Address(CREATE2_DEPLOYER, SALT, ethers.keccak256(code));
}

describe("CREATE2 deployment of plops genesis", () => {
  beforeEach(async () => {
    // a fixed salt can only be used once per chain, so every case starts from a clean chain
    await ethers.provider.send("hardhat_reset", []);
    await ethers.provider.send("hardhat_setCode", [CREATE2_DEPLOYER, PROXY_RUNTIME]);
  });

  it("lands on the predicted address and keeps the deployer as owner", async () => {
    const [owner] = await ethers.getSigners();
    const code = await initCode(owner.address);
    const predicted = predict(code);

    expect(await ethers.provider.getCode(predicted)).to.equal("0x");
    await owner.sendTransaction({
      to: CREATE2_DEPLOYER,
      data: ethers.concat([SALT, code]),
    });
    expect(await ethers.provider.getCode(predicted)).to.not.equal("0x");

    const nft = await ethers.getContractAt("PlopsNFT", predicted);
    expect(await nft.owner()).to.equal(owner.address);
    expect(await nft.MAX_SUPPLY()).to.equal(1500n);
    expect(await nft.name()).to.equal("plops genesis");
  });

  it("predicts from the bytecode the frontend actually ships", async () => {
    const shipped = /PLOPS_NFT_BYTECODE = "(0x[0-9a-fA-F]+)"/.exec(
      fs.readFileSync(path.join(__dirname, "../../src/contracts/PlopsNFT.ts"), "utf8"),
    )[1];
    const artifact = await artifacts.readArtifact("PlopsNFT");
    expect(shipped).to.equal(artifact.bytecode);
  });

  it("is a pure function of salt, init code and proxy — anyone can reproduce it", async () => {
    const [owner, other] = await ethers.getSigners();
    const code = await initCode(owner.address);

    // same inputs, different sender: the address is unchanged
    await other.sendTransaction({ to: CREATE2_DEPLOYER, data: ethers.concat([SALT, code]) });
    const nft = await ethers.getContractAt("PlopsNFT", predict(code));
    expect(await nft.owner()).to.equal(owner.address);

    // a different owner argument changes the init code, so the address changes too
    expect(predict(await initCode(other.address))).to.not.equal(predict(code));

    // a different salt changes the address too
    const otherSalt = ethers.id("plops genesis v2");
    expect(ethers.getCreate2Address(CREATE2_DEPLOYER, otherSalt, ethers.keccak256(code))).to.not.equal(
      predict(code),
    );
  });

  it("mints from the CREATE2 address, with art fixed by that address", async () => {
    const [owner, buyer] = await ethers.getSigners();
    const code = await initCode(owner.address);
    await owner.sendTransaction({ to: CREATE2_DEPLOYER, data: ethers.concat([SALT, code]) });

    const nft = await ethers.getContractAt("PlopsNFT", predict(code));
    const before = await nft.tokenSVG(1);
    await nft.connect(buyer).mint(1, { value: ethers.parseEther("0.01") });
    expect(await nft.ownerOf(1)).to.equal(buyer.address);
    expect(await nft.tokenSVG(1)).to.equal(before);
  });
});
