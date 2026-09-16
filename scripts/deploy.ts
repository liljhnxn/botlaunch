import hre from "hardhat";
const { ethers, artifacts } = hre;
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log("Deploying BotLaunch contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BOT");
  console.log("----------------------------------------------------");

  // 1. Deploy BotToken (Nova Token sample)
  const initialSupply = ethers.parseUnits("1000000", 18); // 1,000,000 NOVA
  const BotTokenFactory = await ethers.getContractFactory("BotToken");
  const botToken = await BotTokenFactory.deploy(
    "Nova Token",
    "NOVA",
    initialSupply,
    deployer.address
  );
  await botToken.waitForDeployment();
  const botTokenAddress = await botToken.getAddress();
  console.log("BotToken deployed:");
  console.log(botTokenAddress);

  // 2. Deploy BotLaunchpad
  const BotLaunchpadFactory = await ethers.getContractFactory("BotLaunchpad");
  const botLaunchpad = await BotLaunchpadFactory.deploy();
  await botLaunchpad.waitForDeployment();
  const botLaunchpadAddress = await botLaunchpad.getAddress();
  console.log("BotLaunchpad deployed:");
  console.log(botLaunchpadAddress);
  console.log("----------------------------------------------------");

  // Export addresses and ABIs to frontend directory
  const contractsDir = path.join(process.cwd(), "src", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const addresses = {
    botToken: botTokenAddress,
    botLaunchpad: botLaunchpadAddress,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
  };

  fs.writeFileSync(
    path.join(contractsDir, "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );

  // Copy ABIs
  const tokenArtifact = await artifacts.readArtifact("BotToken");
  const launchpadArtifact = await artifacts.readArtifact("BotLaunchpad");

  fs.writeFileSync(
    path.join(contractsDir, "BotToken.json"),
    JSON.stringify(tokenArtifact, null, 2)
  );

  fs.writeFileSync(
    path.join(contractsDir, "BotLaunchpad.json"),
    JSON.stringify(launchpadArtifact, null, 2)
  );

  // Update .env.local if present
  const envLocalPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    let envContent = fs.readFileSync(envLocalPath, "utf-8");
    envContent = envContent.replace(
      /NEXT_PUBLIC_BOTLAUNCH_ADDRESS=.*/,
      `NEXT_PUBLIC_BOTLAUNCH_ADDRESS=${botLaunchpadAddress}`
    );
    envContent = envContent.replace(
      /NEXT_PUBLIC_BOTTOKEN_ADDRESS=.*/,
      `NEXT_PUBLIC_BOTTOKEN_ADDRESS=${botTokenAddress}`
    );
    fs.writeFileSync(envLocalPath, envContent);
    console.log("Updated .env.local with deployed addresses");
  }

  console.log("Artifacts and addresses successfully exported to src/contracts/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
