const hre = require("hardhat");

async function main() {
  const SnakeScore = await hre.ethers.getContractFactory("SnakeScore");
  const snakeScore = await SnakeScore.deploy();
  await snakeScore.waitForDeployment();

  const address = await snakeScore.getAddress();
  console.log("SnakeScore deployed to:", address);
  console.log("\nUpdate this address in frontend/app.js (CONTRACT_ADDRESS)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
