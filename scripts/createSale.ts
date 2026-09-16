import hre from "hardhat";
const { ethers } = hre;
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log("Creating live token sale on Botchain Testnet");
  console.log("Creator account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BOT");
  console.log("----------------------------------------------------");

  const launchpadAddress = process.env.NEXT_PUBLIC_BOTLAUNCH_ADDRESS;
  const tokenAddress = process.env.NEXT_PUBLIC_BOTTOKEN_ADDRESS;

  if (!launchpadAddress || !tokenAddress) {
    throw new Error("Missing contract addresses in .env.local");
  }

  const BotTokenFactory = await ethers.getContractFactory("BotToken");
  const botToken = BotTokenFactory.attach(tokenAddress) as any;

  const BotLaunchpadFactory = await ethers.getContractFactory("BotLaunchpad");
  const botLaunchpad = BotLaunchpadFactory.attach(launchpadAddress) as any;

  // Sale economics:
  // Price: 0.0001 BOT per 1 NOVA
  // Soft Cap: 0.02 BOT
  // Hard Cap: 0.05 BOT
  // Min Contribution: 0.001 BOT
  // Max Contribution: 0.025 BOT
  // Duration: 7 days
  const tokenAmount = ethers.parseUnits("5000", 18); // 5,000 NOVA deposited
  const tokenPrice = ethers.parseEther("0.0001"); // 0.0001 BOT
  const softCap = ethers.parseEther("0.02"); // 0.02 BOT
  const hardCap = ethers.parseEther("0.05"); // 0.05 BOT (needs 500 NOVA to cover)
  const minContribution = ethers.parseEther("0.001"); // 0.001 BOT
  const maxContribution = ethers.parseEther("0.025"); // 0.025 BOT

  const now = Math.floor(Date.now() / 1000);
  const startTime = now - 30; // live immediately
  const endTime = now + 7 * 86400; // ends in 7 days

  // Step 1: Approve Launchpad
  console.log("1. Approving BotLaunchpad to spend 5,000 NOVA...");
  const approveTx = await botToken.approve(launchpadAddress, tokenAmount);
  await approveTx.wait();
  console.log("✓ Tokens approved! Tx:", approveTx.hash);

  // Step 2: Create Sale
  console.log("2. Creating sale on BotLaunchpad...");
  const createTx = await botLaunchpad.createSale(
    tokenAddress,
    tokenAmount,
    tokenPrice,
    softCap,
    hardCap,
    minContribution,
    maxContribution,
    startTime,
    endTime
  );
  const receipt = await createTx.wait();
  console.log("✓ Sale created successfully! Tx:", createTx.hash);

  const saleCount = await botLaunchpad.saleCount();
  console.log("----------------------------------------------------");
  console.log("🎉 LIVE SALE ID:", saleCount.toString());
  console.log("View in dApp: http://localhost:3002/sales/" + saleCount.toString());
  console.log("View on BohrScan: https://scan.bohr.life/tx/" + createTx.hash);
  console.log("----------------------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to create sale:", err);
    process.exit(1);
  });
