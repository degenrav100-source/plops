// Renders a contact sheet of on-chain plops art so the pixel logo can be eyeballed locally.
const fs = require("fs");
const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const nft = await (await hre.ethers.getContractFactory("PlopsNFT")).deploy(owner.address);
  await nft.waitForDeployment();

  const ids = Array.from({ length: 24 }, (_, i) => i + 1);
  const cells = [];
  for (const id of ids) {
    const svg = await nft.tokenSVG(id);
    const t = await nft.traitsOf(id);
    cells.push(
      `<figure><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}" width="180"/>` +
        `<figcaption>#${id} ears${t.ears} eyes${t.eyes} mouth${t.mouth} extra${t.extra}</figcaption></figure>`,
    );
  }
  fs.writeFileSync(
    "/home/ubuntu/nft-preview.html",
    `<body style="background:#111;color:#eee;font:12px monospace;display:flex;flex-wrap:wrap;gap:8px">${cells.join("")}</body>`,
  );
  console.log("wrote /home/ubuntu/nft-preview.html");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
