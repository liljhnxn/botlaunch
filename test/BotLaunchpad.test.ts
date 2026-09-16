import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { BotToken, BotLaunchpad } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("BotLaunchpad & BotToken Test Suite", function () {
  let botToken: BotToken;
  let launchpad: BotLaunchpad;
  let owner: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let buyer1: HardhatEthersSigner;
  let buyer2: HardhatEthersSigner;
  let buyer3: HardhatEthersSigner;

  // Constants
  const TOKEN_DECIMALS = 18n;
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", TOKEN_DECIMALS); // 1,000,000 NOVA
  const SALE_TOKEN_AMOUNT = ethers.parseUnits("5000", TOKEN_DECIMALS); // 5,000 NOVA
  const TOKEN_PRICE = ethers.parseEther("0.01"); // 0.01 BOT per 1 NOVA
  const SOFT_CAP = ethers.parseEther("10"); // 10 BOT
  const HARD_CAP = ethers.parseEther("50"); // 50 BOT (needs 5,000 NOVA at 0.01 BOT)
  const MIN_CONTRIB = ethers.parseEther("0.1"); // 0.1 BOT
  const MAX_CONTRIB = ethers.parseEther("25"); // 25 BOT

  beforeEach(async function () {
    [owner, creator, buyer1, buyer2, buyer3] = await ethers.getSigners();

    // Deploy BotToken with creator as recipient
    const BotTokenFactory = await ethers.getContractFactory("BotToken");
    botToken = (await BotTokenFactory.deploy(
      "Nova Token",
      "NOVA",
      INITIAL_SUPPLY,
      creator.address
    )) as BotToken;
    await botToken.waitForDeployment();

    // Deploy BotLaunchpad
    const BotLaunchpadFactory = await ethers.getContractFactory("BotLaunchpad");
    launchpad = (await BotLaunchpadFactory.deploy()) as BotLaunchpad;
    await launchpad.waitForDeployment();
  });

  describe("1. BotToken Deployment", function () {
    it("Should set correct token name and symbol", async function () {
      expect(await botToken.name()).to.equal("Nova Token");
      expect(await botToken.symbol()).to.equal("NOVA");
      expect(await botToken.decimals()).to.equal(18);
    });

    it("Should mint initial supply to recipient", async function () {
      expect(await botToken.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await botToken.balanceOf(creator.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should revert deployment with zero address recipient or zero supply", async function () {
      const BotTokenFactory = await ethers.getContractFactory("BotToken");
      await expect(
        BotTokenFactory.deploy("Nova", "NOVA", INITIAL_SUPPLY, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid recipient");

      await expect(
        BotTokenFactory.deploy("Nova", "NOVA", 0, creator.address)
      ).to.be.revertedWith("Supply must be positive");
    });
  });

  describe("2. Sale Creation", function () {
    it("Should create a sale successfully and transfer tokens to launchpad", async function () {
      const now = await time.latest();
      const startTime = now + 60;
      const endTime = startTime + 3600;

      // Creator approves launchpad to spend SALE_TOKEN_AMOUNT
      await botToken.connect(creator).approve(await launchpad.getAddress(), SALE_TOKEN_AMOUNT);

      const tx = await launchpad.connect(creator).createSale(
        await botToken.getAddress(),
        SALE_TOKEN_AMOUNT,
        TOKEN_PRICE,
        SOFT_CAP,
        HARD_CAP,
        MIN_CONTRIB,
        MAX_CONTRIB,
        startTime,
        endTime
      );

      await expect(tx)
        .to.emit(launchpad, "SaleCreated")
        .withArgs(
          1,
          creator.address,
          await botToken.getAddress(),
          SALE_TOKEN_AMOUNT,
          TOKEN_PRICE,
          SOFT_CAP,
          HARD_CAP,
          startTime,
          endTime
        );

      expect(await launchpad.saleCount()).to.equal(1);
      const sale = await launchpad.getSale(1);
      expect(sale.creator).to.equal(creator.address);
      expect(sale.token).to.equal(await botToken.getAddress());
      expect(sale.tokenAmount).to.equal(SALE_TOKEN_AMOUNT);
      expect(sale.totalRaised).to.equal(0);
      expect(sale.finalized).to.be.false;

      // Contract should hold the deposited tokens
      expect(await botToken.balanceOf(await launchpad.getAddress())).to.equal(SALE_TOKEN_AMOUNT);
    });

    it("Should revert if token address is zero", async function () {
      const now = await time.latest();
      await expect(
        launchpad.connect(creator).createSale(
          ethers.ZeroAddress,
          SALE_TOKEN_AMOUNT,
          TOKEN_PRICE,
          SOFT_CAP,
          HARD_CAP,
          MIN_CONTRIB,
          MAX_CONTRIB,
          now + 60,
          now + 3600
        )
      ).to.be.revertedWith("Zero token address");
    });

    it("Should revert if hardCap <= softCap", async function () {
      const now = await time.latest();
      await expect(
        launchpad.connect(creator).createSale(
          await botToken.getAddress(),
          SALE_TOKEN_AMOUNT,
          TOKEN_PRICE,
          HARD_CAP,
          SOFT_CAP,
          MIN_CONTRIB,
          MAX_CONTRIB,
          now + 60,
          now + 3600
        )
      ).to.be.revertedWith("Hard cap must exceed soft cap");
    });

    it("Should revert if endTime <= startTime", async function () {
      const now = await time.latest();
      await expect(
        launchpad.connect(creator).createSale(
          await botToken.getAddress(),
          SALE_TOKEN_AMOUNT,
          TOKEN_PRICE,
          SOFT_CAP,
          HARD_CAP,
          MIN_CONTRIB,
          MAX_CONTRIB,
          now + 600,
          now + 300
        )
      ).to.be.revertedWith("End time must be after start time");
    });

    it("Should revert if token amount deposited is insufficient to cover hardCap", async function () {
      const now = await time.latest();
      // Required for 50 BOT hard cap at 0.01 price is 5,000 NOVA
      const insufficientTokens = ethers.parseUnits("4000", TOKEN_DECIMALS);
      await botToken.connect(creator).approve(await launchpad.getAddress(), insufficientTokens);

      await expect(
        launchpad.connect(creator).createSale(
          await botToken.getAddress(),
          insufficientTokens,
          TOKEN_PRICE,
          SOFT_CAP,
          HARD_CAP,
          MIN_CONTRIB,
          MAX_CONTRIB,
          now + 60,
          now + 3600
        )
      ).to.be.revertedWith("Token amount insufficient for hard cap");
    });
  });

  describe("3. Participation Mechanics", function () {
    let startTime: number;
    let endTime: number;

    beforeEach(async function () {
      const now = await time.latest();
      startTime = now + 100;
      endTime = startTime + 3600;

      await botToken.connect(creator).approve(await launchpad.getAddress(), SALE_TOKEN_AMOUNT);
      await launchpad.connect(creator).createSale(
        await botToken.getAddress(),
        SALE_TOKEN_AMOUNT,
        TOKEN_PRICE,
        SOFT_CAP,
        HARD_CAP,
        MIN_CONTRIB,
        MAX_CONTRIB,
        startTime,
        endTime
      );
    });

    it("Should revert if participating before startTime", async function () {
      await expect(
        launchpad.connect(buyer1).participate(1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Sale has not started");
    });

    it("Should accept valid contribution during sale window", async function () {
      await time.increaseTo(startTime + 10);

      const contrib = ethers.parseEther("5");
      const tx = await launchpad.connect(buyer1).participate(1, { value: contrib });

      await expect(tx)
        .to.emit(launchpad, "SaleParticipation")
        .withArgs(1, buyer1.address, contrib);

      expect(await launchpad.getContribution(1, buyer1.address)).to.equal(contrib);
      const sale = await launchpad.getSale(1);
      expect(sale.totalRaised).to.equal(contrib);
      expect(await launchpad.participantCount(1)).to.equal(1);
    });

    it("Should reject contribution below minContribution", async function () {
      await time.increaseTo(startTime + 10);
      await expect(
        launchpad.connect(buyer1).participate(1, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Contribution below minimum");
    });

    it("Should reject contribution exceeding maxContribution", async function () {
      await time.increaseTo(startTime + 10);
      await expect(
        launchpad.connect(buyer1).participate(1, { value: ethers.parseEther("30") })
      ).to.be.revertedWith("Exceeds max contribution limit");
    });

    it("Should reject contribution that exceeds hardCap", async function () {
      await time.increaseTo(startTime + 10);
      // buyer1 contributes 25 BOT
      await launchpad.connect(buyer1).participate(1, { value: ethers.parseEther("25") });
      // buyer2 contributes 25 BOT -> hits hard cap (50 BOT)
      await launchpad.connect(buyer2).participate(1, { value: ethers.parseEther("25") });

      // buyer3 tries to contribute 1 BOT -> exceeds hard cap
      await expect(
        launchpad.connect(buyer3).participate(1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Exceeds hard cap");
    });

    it("Should reject participation after endTime", async function () {
      await time.increaseTo(endTime + 10);
      await expect(
        launchpad.connect(buyer1).participate(1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Sale has ended");
    });
  });

  describe("4. Finalization, Claims, and Creator Withdrawals (Successful Sale)", function () {
    let startTime: number;
    let endTime: number;

    beforeEach(async function () {
      const now = await time.latest();
      startTime = now + 100;
      endTime = startTime + 3600;

      await botToken.connect(creator).approve(await launchpad.getAddress(), SALE_TOKEN_AMOUNT);
      await launchpad.connect(creator).createSale(
        await botToken.getAddress(),
        SALE_TOKEN_AMOUNT,
        TOKEN_PRICE,
        SOFT_CAP, // 10 BOT
        HARD_CAP, // 50 BOT
        MIN_CONTRIB,
        MAX_CONTRIB,
        startTime,
        endTime
      );

      // Advance to start time
      await time.increaseTo(startTime + 10);

      // buyer1 contributes 15 BOT (surpasses 10 BOT soft cap)
      await launchpad.connect(buyer1).participate(1, { value: ethers.parseEther("15") });
      // buyer2 contributes 5 BOT
      await launchpad.connect(buyer2).participate(1, { value: ethers.parseEther("5") });
    });

    it("Should not allow finalization before endTime unless hard cap reached", async function () {
      await expect(launchpad.finalizeSale(1)).to.be.revertedWith("Sale still active");
    });

    it("Should finalize successfully after endTime", async function () {
      await time.increaseTo(endTime + 1);

      const tx = await launchpad.finalizeSale(1);
      await expect(tx)
        .to.emit(launchpad, "SaleFinalized")
        .withArgs(1, true, ethers.parseEther("20"));

      const sale = await launchpad.getSale(1);
      expect(sale.finalized).to.be.true;
      expect(sale.successful).to.be.true;
    });

    it("Should calculate and distribute exact claimable tokens for participants", async function () {
      await time.increaseTo(endTime + 1);
      await launchpad.finalizeSale(1);

      // buyer1 contributed 15 BOT at 0.01 BOT/NOVA => 1,500 NOVA
      const expectedBuyer1Tokens = ethers.parseUnits("1500", TOKEN_DECIMALS);
      expect(await launchpad.getClaimableTokens(1, buyer1.address)).to.equal(expectedBuyer1Tokens);

      const tx = await launchpad.connect(buyer1).claim(1);
      await expect(tx)
        .to.emit(launchpad, "TokensClaimed")
        .withArgs(1, buyer1.address, expectedBuyer1Tokens);

      expect(await botToken.balanceOf(buyer1.address)).to.equal(expectedBuyer1Tokens);
      expect(await launchpad.isClaimed(1, buyer1.address)).to.be.true;

      // Double claim should be rejected
      await expect(launchpad.connect(buyer1).claim(1)).to.be.revertedWith("Tokens already claimed");
    });

    it("Should not allow refunds on a successful sale", async function () {
      await time.increaseTo(endTime + 1);
      await launchpad.finalizeSale(1);

      await expect(launchpad.connect(buyer1).refund(1)).to.be.revertedWith(
        "Sale was successful, cannot refund"
      );
    });

    it("Should allow creator to withdraw raised BOT", async function () {
      await time.increaseTo(endTime + 1);
      await launchpad.finalizeSale(1);

      const totalRaised = ethers.parseEther("20");
      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);

      const tx = await launchpad.connect(creator).withdrawRaisedFunds(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
      expect(creatorBalanceAfter).to.equal(creatorBalanceBefore + totalRaised - gasUsed);

      // Cannot withdraw twice
      await expect(launchpad.connect(creator).withdrawRaisedFunds(1)).to.be.revertedWith(
        "Funds already withdrawn"
      );

      // Non-creator cannot withdraw
      await expect(launchpad.connect(buyer1).withdrawRaisedFunds(1)).to.be.revertedWith(
        "Caller is not creator"
      );
    });

    it("Should allow creator to withdraw only unsold tokens on successful sale", async function () {
      await time.increaseTo(endTime + 1);
      await launchpad.finalizeSale(1);

      // Total raised: 20 BOT => sold 2,000 NOVA
      // Deposited: 5,000 NOVA => Unsold: 3,000 NOVA
      const expectedUnsold = ethers.parseUnits("3000", TOKEN_DECIMALS);
      const creatorTokensBefore = await botToken.balanceOf(creator.address);

      const tx = await launchpad.connect(creator).withdrawUnsoldTokens(1);
      await expect(tx)
        .to.emit(launchpad, "UnsoldTokensWithdrawn")
        .withArgs(1, creator.address, expectedUnsold);

      expect(await botToken.balanceOf(creator.address)).to.equal(
        creatorTokensBefore + expectedUnsold
      );

      // Cannot withdraw twice
      await expect(launchpad.connect(creator).withdrawUnsoldTokens(1)).to.be.revertedWith(
        "Unsold tokens already withdrawn"
      );
    });
  });

  describe("5. Failed Sale & Refunds", function () {
    let startTime: number;
    let endTime: number;

    beforeEach(async function () {
      const now = await time.latest();
      startTime = now + 100;
      endTime = startTime + 3600;

      await botToken.connect(creator).approve(await launchpad.getAddress(), SALE_TOKEN_AMOUNT);
      await launchpad.connect(creator).createSale(
        await botToken.getAddress(),
        SALE_TOKEN_AMOUNT,
        TOKEN_PRICE,
        SOFT_CAP, // 10 BOT
        HARD_CAP,
        MIN_CONTRIB,
        MAX_CONTRIB,
        startTime,
        endTime
      );

      await time.increaseTo(startTime + 10);

      // buyer1 contributes 5 BOT (below 10 BOT soft cap)
      await launchpad.connect(buyer1).participate(1, { value: ethers.parseEther("5") });
    });

    it("Should mark sale as failed upon finalization", async function () {
      await time.increaseTo(endTime + 1);
      await launchpad.finalizeSale(1);

      const sale = await launchpad.getSale(1);
      expect(sale.finalized).to.be.true;
      expect(sale.successful).to.be.false;
    });

    it("Should allow participants to refund full BOT contribution", async function () {
      await time.increaseTo(endTime + 1);
      await launchpad.finalizeSale(1);

      const contrib = ethers.parseEther("5");
      const balanceBefore = await ethers.provider.getBalance(buyer1.address);

      const tx = await launchpad.connect(buyer1).refund(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(buyer1.address);
      expect(balanceAfter).to.equal(balanceBefore + contrib - gasUsed);
      expect(await launchpad.isRefunded(1, buyer1.address)).to.be.true;

      // Double refund prevented
      await expect(launchpad.connect(buyer1).refund(1)).to.be.revertedWith("Already refunded");
    });

    it("Should not allow claims on a failed sale", async function () {
      await time.increaseTo(endTime + 1);
      await launchpad.finalizeSale(1);

      await expect(launchpad.connect(buyer1).claim(1)).to.be.revertedWith(
        "Sale was not successful"
      );
    });

    it("Should allow creator to recover 100% of deposited tokens on failed sale", async function () {
      await time.increaseTo(endTime + 1);
      await launchpad.finalizeSale(1);

      const creatorTokensBefore = await botToken.balanceOf(creator.address);

      await launchpad.connect(creator).withdrawUnsoldTokens(1);

      expect(await botToken.balanceOf(creator.address)).to.equal(
        creatorTokensBefore + SALE_TOKEN_AMOUNT
      );
    });

    it("Should not allow creator to withdraw funds from failed sale", async function () {
      await time.increaseTo(endTime + 1);
      await launchpad.finalizeSale(1);

      await expect(launchpad.connect(creator).withdrawRaisedFunds(1)).to.be.revertedWith(
        "Sale was not successful"
      );
    });
  });
});
