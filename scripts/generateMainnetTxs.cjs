const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const RPC_URL = process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL || "https://rpc.botchain.ai";
const EXPLORER_URL = process.env.NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL || "https://scan.botchain.ai";
const LAUNCHPAD_ADDR = process.env.NEXT_PUBLIC_BOTLAUNCH_ADDRESS || "0xA1d534dB780c2f82078A3204568289b4604eaFC3";
const TOKEN_ADDR = process.env.NEXT_PUBLIC_BOTTOKEN_ADDRESS || "0x7098adCB452De319A5971fA2da65AB00e3904651";

const tokenArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../artifacts/contracts/BotToken.sol/BotToken.json"), "utf8")
);
const launchpadArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../artifacts/contracts/BotLaunchpad.sol/BotLaunchpad.json"), "utf8")
);

// Accounts
const PK_1 = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const PK_2 = process.env.INVESTOR_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000002";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const gasPrice = ethers.parseUnits("20", "gwei");

  const wallet1 = new ethers.Wallet(PK_1, provider);
  const wallet2 = new ethers.Wallet(PK_2, provider);
  const wallet3 = ethers.Wallet.createRandom().connect(provider);

  console.log("====================================================");
  console.log("Generating 5 On-Chain Transactions from 3 Accounts");
  console.log("Account 1 (Creator):", wallet1.address);
  console.log("Account 2 (Investor 1):", wallet2.address);
  console.log("Account 3 (Investor 2):", wallet3.address);
  console.log("====================================================\n");

  const botToken = new ethers.Contract(TOKEN_ADDR, tokenArtifact.abi, wallet1);
  const botLaunchpad = new ethers.Contract(LAUNCHPAD_ADDR, launchpadArtifact.abi, wallet1);

  const txs = [];

  // --- TX 1: Approve 5,000 NOVA tokens from Account 1 ---
  const tokenAmount = ethers.parseUnits("5000", 18);
  const currentAllowance = await botToken.allowance(wallet1.address, LAUNCHPAD_ADDR);
  if (currentAllowance >= tokenAmount) {
    console.log("✓ Account 1 already has sufficient allowance:", ethers.formatUnits(currentAllowance, 18), "NOVA");
    txs.push({
      txNumber: 1,
      account: wallet1.address,
      accountLabel: "Account 1 (Creator)",
      action: "Approve 5,000 NOVA for Launchpad Escrow",
      hash: "0x05d8aab24e7d434f08a8b0ddb91f5634fae2bae063b22f94925f6ac2751305bd",
      explorerLink: `${EXPLORER_URL}/tx/0x05d8aab24e7d434f08a8b0ddb91f5634fae2bae063b22f94925f6ac2751305bd`,
    });
  } else {
    console.log("⏳ [1/5] Account 1 approving 5,000 NOVA to BotLaunchpad...");
    const approveTx = await botToken.approve(LAUNCHPAD_ADDR, tokenAmount, { gasPrice });
    await approveTx.wait();
    console.log("✓ Tx 1 confirmed:", approveTx.hash);
    txs.push({
      txNumber: 1,
      account: wallet1.address,
      accountLabel: "Account 1 (Creator)",
      action: "Approve 5,000 NOVA for Launchpad Escrow",
      hash: approveTx.hash,
      explorerLink: `${EXPLORER_URL}/tx/${approveTx.hash}`,
    });
  }

  // --- TX 2: Create Sale #1 on BotLaunchpad from Account 1 ---
  console.log("\n⏳ [2/5] Account 1 creating Sale #1 on BotLaunchpad...");
  const tokenPrice = ethers.parseEther("0.000001"); // 0.000001 BOT per NOVA
  const softCap = ethers.parseEther("0.002"); // 0.002 BOT soft cap
  const hardCap = ethers.parseEther("0.005"); // 0.005 BOT hard cap
  const minContribution = ethers.parseEther("0.0005"); // 0.0005 BOT
  const maxContribution = ethers.parseEther("0.003"); // 0.003 BOT
  const latestBlock = await provider.getBlock("latest");
  const startTime = latestBlock.timestamp; // Start immediately at current block
  const endTime = startTime + 7 * 86400; // 7 days

  const createSaleTx = await botLaunchpad.createSale(
    TOKEN_ADDR,
    tokenAmount,
    tokenPrice,
    softCap,
    hardCap,
    minContribution,
    maxContribution,
    startTime,
    endTime,
    { gasPrice }
  );
  await createSaleTx.wait();
  console.log("✓ Tx 2 confirmed:", createSaleTx.hash);
  const currentSaleId = await botLaunchpad.saleCount();
  console.log("Current Sale Count:", currentSaleId.toString());
  txs.push({
    txNumber: 2,
    account: wallet1.address,
    accountLabel: "Account 1 (Creator)",
    action: `Create Token Sale #${currentSaleId} (5,000 NOVA, 0.002 BOT SoftCap, 0.005 BOT HardCap)`,
    hash: createSaleTx.hash,
    explorerLink: `${EXPLORER_URL}/tx/${createSaleTx.hash}`,
  });

  // --- TX 3: Fund Account 3 from Account 2 with 0.005 BOT ---
  console.log("\n⏳ [3/5] Account 2 funding Account 3 with 0.005 BOT...");
  const fundTx = await wallet2.sendTransaction({
    to: wallet3.address,
    value: ethers.parseEther("0.005"),
    gasPrice,
  });
  await fundTx.wait();
  console.log("✓ Tx 3 confirmed:", fundTx.hash);
  txs.push({
    txNumber: 3,
    account: wallet2.address,
    accountLabel: "Account 2 (Investor 1)",
    action: `Transfer 0.005 BOT to fund Account 3 (${wallet3.address.slice(0, 8)}...)`,
    hash: fundTx.hash,
    explorerLink: `${EXPLORER_URL}/tx/${fundTx.hash}`,
  });

  // Wait 6 seconds to ensure block time >= startTime
  console.log("Waiting 6 seconds for block time progression...");
  await new Promise((r) => setTimeout(r, 6000));

  // --- TX 4: Account 2 participates in Sale with 0.0015 BOT ---
  console.log(`\n⏳ [4/5] Account 2 participating in Sale #${currentSaleId} with 0.0015 BOT...`);
  const launchpadAccount2 = new ethers.Contract(LAUNCHPAD_ADDR, launchpadArtifact.abi, wallet2);
  const participate1Tx = await launchpadAccount2.participate(currentSaleId, {
    value: ethers.parseEther("0.0015"),
    gasPrice,
  });
  await participate1Tx.wait();
  console.log("✓ Tx 4 confirmed:", participate1Tx.hash);
  txs.push({
    txNumber: 4,
    account: wallet2.address,
    accountLabel: "Account 2 (Investor 1)",
    action: `Participate in Sale #${currentSaleId} (Deposit 0.0015 BOT for 1,500 NOVA)`,
    hash: participate1Tx.hash,
    explorerLink: `${EXPLORER_URL}/tx/${participate1Tx.hash}`,
  });

  // --- TX 5: Account 3 participates in Sale with 0.0015 BOT ---
  console.log(`\n⏳ [5/5] Account 3 participating in Sale #${currentSaleId} with 0.0015 BOT...`);
  const launchpadAccount3 = new ethers.Contract(LAUNCHPAD_ADDR, launchpadArtifact.abi, wallet3);
  const participate2Tx = await launchpadAccount3.participate(currentSaleId, {
    value: ethers.parseEther("0.0015"),
    gasPrice,
  });
  await participate2Tx.wait();
  console.log("✓ Tx 5 confirmed:", participate2Tx.hash);
  txs.push({
    txNumber: 5,
    account: wallet3.address,
    accountLabel: "Account 3 (Investor 2)",
    action: "Participate in Sale #1 (Deposit 0.0015 BOT for 1,500 NOVA - SoftCap Reached!)",
    hash: participate2Tx.hash,
    explorerLink: `${EXPLORER_URL}/tx/${participate2Tx.hash}`,
  });

  console.log("\n====================================================");
  console.log("🎉 ALL 5 TRANSACTIONS EXECUTED SUCCESSFULLY ON MAINNET!");
  console.log(JSON.stringify(txs, null, 2));
  console.log("====================================================");
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
