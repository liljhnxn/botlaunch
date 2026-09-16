// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BotLaunchpad
 * @dev Decentralized token launchpad on Botchain Testnet for launching, funding, and claiming project tokens.
 */
contract BotLaunchpad is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Details of a token sale
    struct Sale {
        uint256 id;
        address creator;
        address token;
        uint256 tokenAmount;       // Total tokens deposited for the sale
        uint256 tokenPrice;        // Price in wei of BOT per 1 whole project token (10**decimals)
        uint256 softCap;           // Minimum BOT required for sale to succeed (in wei)
        uint256 hardCap;           // Maximum BOT allowed to be raised (in wei)
        uint256 minContribution;   // Minimum BOT contribution per transaction (in wei)
        uint256 maxContribution;   // Maximum total BOT contribution per wallet (in wei)
        uint256 startTime;         // Unix timestamp when sale opens
        uint256 endTime;           // Unix timestamp when sale closes
        uint256 totalRaised;       // Total BOT raised so far (in wei)
        bool finalized;            // Whether sale has been finalized
        bool successful;           // Whether sale achieved softCap upon finalization
    }

    /// @notice Number of sales created
    uint256 public saleCount;

    /// @notice Mapping from sale ID to Sale details
    mapping(uint256 => Sale) public sales;

    /// @notice Mapping from sale ID => participant address => total BOT contributed
    mapping(uint256 => mapping(address => uint256)) public contributions;

    /// @notice Mapping from sale ID => participant address => whether tokens have been claimed
    mapping(uint256 => mapping(address => bool)) public claimed;

    /// @notice Mapping from sale ID => participant address => whether contribution has been refunded
    mapping(uint256 => mapping(address => bool)) public refunded;

    /// @notice Mapping from sale ID => whether creator has withdrawn raised BOT
    mapping(uint256 => bool) public fundsWithdrawn;

    /// @notice Mapping from sale ID => whether creator has withdrawn unsold tokens
    mapping(uint256 => bool) public unsoldTokensWithdrawn;

    /// @notice Mapping from sale ID => unique participant count
    mapping(uint256 => uint256) public participantCount;

    /// @notice Internal tracking of unique contributors
    mapping(uint256 => mapping(address => bool)) private _hasParticipated;

    // --- EVENTS ---

    event SaleCreated(
        uint256 indexed saleId,
        address indexed creator,
        address indexed token,
        uint256 tokenAmount,
        uint256 tokenPrice,
        uint256 softCap,
        uint256 hardCap,
        uint256 startTime,
        uint256 endTime
    );

    event SaleParticipation(
        uint256 indexed saleId,
        address indexed participant,
        uint256 amount
    );

    event SaleFinalized(
        uint256 indexed saleId,
        bool successful,
        uint256 totalRaised
    );

    event TokensClaimed(
        uint256 indexed saleId,
        address indexed participant,
        uint256 tokenAmount
    );

    event Refunded(
        uint256 indexed saleId,
        address indexed participant,
        uint256 amount
    );

    event FundsWithdrawn(
        uint256 indexed saleId,
        address indexed creator,
        uint256 amount
    );

    event UnsoldTokensWithdrawn(
        uint256 indexed saleId,
        address indexed creator,
        uint256 tokenAmount
    );

    // --- CORE MUTATIVE FUNCTIONS ---

    /**
     * @notice Creates a new token sale and transfers sale tokens into escrow.
     * @param token Address of the ERC-20 token being sold
     * @param tokenAmount Total token units deposited for the sale
     * @param tokenPrice BOT in wei required to purchase 1 whole token (10**decimals)
     * @param softCap Minimum BOT needed for success (in wei)
     * @param hardCap Maximum BOT capacity (in wei)
     * @param minContribution Minimum BOT contribution per call (in wei)
     * @param maxContribution Maximum cumulative BOT contribution per wallet (in wei)
     * @param startTime Timestamp when sale starts
     * @param endTime Timestamp when sale ends
     * @return saleId The newly created sale ID
     */
    function createSale(
        address token,
        uint256 tokenAmount,
        uint256 tokenPrice,
        uint256 softCap,
        uint256 hardCap,
        uint256 minContribution,
        uint256 maxContribution,
        uint256 startTime,
        uint256 endTime
    ) external returns (uint256) {
        require(token != address(0), "Zero token address");
        require(tokenAmount > 0, "Zero token amount");
        require(tokenPrice > 0, "Zero token price");
        require(softCap > 0, "Zero soft cap");
        require(hardCap > softCap, "Hard cap must exceed soft cap");
        require(minContribution > 0, "Zero min contribution");
        require(maxContribution >= minContribution, "Max contribution < min contribution");
        require(startTime >= block.timestamp - 1 minutes, "Start time in past");
        require(endTime > startTime, "End time must be after start time");

        uint8 decimals = IERC20Metadata(token).decimals();
        uint256 tokensNeededForHardCap = (hardCap * (10 ** decimals)) / tokenPrice;
        require(tokenAmount >= tokensNeededForHardCap, "Token amount insufficient for hard cap");

        // Transfer tokens from creator into this launchpad contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        saleCount++;
        uint256 currentId = saleCount;

        sales[currentId] = Sale({
            id: currentId,
            creator: msg.sender,
            token: token,
            tokenAmount: tokenAmount,
            tokenPrice: tokenPrice,
            softCap: softCap,
            hardCap: hardCap,
            minContribution: minContribution,
            maxContribution: maxContribution,
            startTime: startTime,
            endTime: endTime,
            totalRaised: 0,
            finalized: false,
            successful: false
        });

        emit SaleCreated(
            currentId,
            msg.sender,
            token,
            tokenAmount,
            tokenPrice,
            softCap,
            hardCap,
            startTime,
            endTime
        );

        return currentId;
    }

    /**
     * @notice Participate in a live sale by sending native BOT.
     * @param saleId The ID of the sale to participate in
     */
    function participate(uint256 saleId) external payable nonReentrant {
        Sale storage sale = sales[saleId];
        require(sale.id != 0, "Sale does not exist");
        require(block.timestamp >= sale.startTime, "Sale has not started");
        require(block.timestamp < sale.endTime, "Sale has ended");
        require(!sale.finalized, "Sale already finalized");
        require(msg.value >= sale.minContribution, "Contribution below minimum");

        uint256 newTotalContribution = contributions[saleId][msg.sender] + msg.value;
        require(newTotalContribution <= sale.maxContribution, "Exceeds max contribution limit");

        uint256 newTotalRaised = sale.totalRaised + msg.value;
        require(newTotalRaised <= sale.hardCap, "Exceeds hard cap");

        contributions[saleId][msg.sender] = newTotalContribution;
        sale.totalRaised = newTotalRaised;

        if (!_hasParticipated[saleId][msg.sender]) {
            _hasParticipated[saleId][msg.sender] = true;
            participantCount[saleId]++;
        }

        emit SaleParticipation(saleId, msg.sender, msg.value);
    }

    /**
     * @notice Finalizes the sale after the end time or if hard cap reached.
     * @param saleId The ID of the sale
     */
    function finalizeSale(uint256 saleId) external nonReentrant {
        Sale storage sale = sales[saleId];
        require(sale.id != 0, "Sale does not exist");
        require(!sale.finalized, "Sale already finalized");
        require(
            block.timestamp >= sale.endTime || sale.totalRaised == sale.hardCap,
            "Sale still active"
        );

        sale.finalized = true;
        sale.successful = (sale.totalRaised >= sale.softCap);

        emit SaleFinalized(saleId, sale.successful, sale.totalRaised);
    }

    /**
     * @notice Claims purchased tokens after a successful sale.
     * @param saleId The ID of the sale
     */
    function claim(uint256 saleId) external nonReentrant {
        Sale storage sale = sales[saleId];
        require(sale.id != 0, "Sale does not exist");
        require(sale.finalized, "Sale not finalized");
        require(sale.successful, "Sale was not successful");

        uint256 contribution = contributions[saleId][msg.sender];
        require(contribution > 0, "No contribution found");
        require(!claimed[saleId][msg.sender], "Tokens already claimed");

        claimed[saleId][msg.sender] = true;

        uint8 decimals = IERC20Metadata(sale.token).decimals();
        uint256 tokenAmount = (contribution * (10 ** decimals)) / sale.tokenPrice;

        IERC20(sale.token).safeTransfer(msg.sender, tokenAmount);

        emit TokensClaimed(saleId, msg.sender, tokenAmount);
    }

    /**
     * @notice Refunds native BOT to participant if sale failed.
     * @param saleId The ID of the sale
     */
    function refund(uint256 saleId) external nonReentrant {
        Sale storage sale = sales[saleId];
        require(sale.id != 0, "Sale does not exist");
        require(sale.finalized, "Sale not finalized");
        require(!sale.successful, "Sale was successful, cannot refund");

        uint256 contribution = contributions[saleId][msg.sender];
        require(contribution > 0, "No contribution found");
        require(!refunded[saleId][msg.sender], "Already refunded");

        refunded[saleId][msg.sender] = true;

        (bool sent, ) = payable(msg.sender).call{value: contribution}("");
        require(sent, "Native BOT refund transfer failed");

        emit Refunded(saleId, msg.sender, contribution);
    }

    /**
     * @notice Creator withdraws raised native BOT after a successful sale.
     * @param saleId The ID of the sale
     */
    function withdrawRaisedFunds(uint256 saleId) external nonReentrant {
        Sale storage sale = sales[saleId];
        require(sale.id != 0, "Sale does not exist");
        require(sale.finalized, "Sale not finalized");
        require(sale.successful, "Sale was not successful");
        require(msg.sender == sale.creator, "Caller is not creator");
        require(!fundsWithdrawn[saleId], "Funds already withdrawn");

        fundsWithdrawn[saleId] = true;
        uint256 amount = sale.totalRaised;

        (bool sent, ) = payable(sale.creator).call{value: amount}("");
        require(sent, "Native BOT transfer failed");

        emit FundsWithdrawn(saleId, sale.creator, amount);
    }

    /**
     * @notice Creator withdraws unsold or returned tokens after sale finalization.
     * @param saleId The ID of the sale
     */
    function withdrawUnsoldTokens(uint256 saleId) external nonReentrant {
        Sale storage sale = sales[saleId];
        require(sale.id != 0, "Sale does not exist");
        require(sale.finalized, "Sale not finalized");
        require(msg.sender == sale.creator, "Caller is not creator");
        require(!unsoldTokensWithdrawn[saleId], "Unsold tokens already withdrawn");

        unsoldTokensWithdrawn[saleId] = true;

        uint256 unsoldTokens;
        if (sale.successful) {
            uint8 decimals = IERC20Metadata(sale.token).decimals();
            uint256 tokensSold = (sale.totalRaised * (10 ** decimals)) / sale.tokenPrice;
            require(sale.tokenAmount >= tokensSold, "Accounting error");
            unsoldTokens = sale.tokenAmount - tokensSold;
        } else {
            // If sale failed, all deposited tokens belong back to creator
            unsoldTokens = sale.tokenAmount;
        }

        require(unsoldTokens > 0, "No unsold tokens to withdraw");

        IERC20(sale.token).safeTransfer(sale.creator, unsoldTokens);

        emit UnsoldTokensWithdrawn(saleId, sale.creator, unsoldTokens);
    }

    // --- VIEW / READ FUNCTIONS ---

    /**
     * @notice Retrieves sale details by ID.
     */
    function getSale(uint256 saleId) external view returns (Sale memory) {
        require(sales[saleId].id != 0, "Sale does not exist");
        return sales[saleId];
    }

    /**
     * @notice Returns total number of sales created.
     */
    function getSaleCount() external view returns (uint256) {
        return saleCount;
    }

    /**
     * @notice Returns the total contributed BOT by a user for a given sale.
     */
    function getContribution(uint256 saleId, address user) external view returns (uint256) {
        return contributions[saleId][user];
    }

    /**
     * @notice Calculates the claimable token units for a user.
     */
    function getClaimableTokens(uint256 saleId, address user) external view returns (uint256) {
        Sale storage sale = sales[saleId];
        if (!sale.finalized || !sale.successful) {
            return 0;
        }
        if (claimed[saleId][user]) {
            return 0;
        }
        uint256 contribution = contributions[saleId][user];
        if (contribution == 0) {
            return 0;
        }
        uint8 decimals = IERC20Metadata(sale.token).decimals();
        return (contribution * (10 ** decimals)) / sale.tokenPrice;
    }

    /**
     * @notice Returns remaining BOT capacity before reaching hard cap.
     */
    function getRemainingCapacity(uint256 saleId) external view returns (uint256) {
        Sale storage sale = sales[saleId];
        if (sale.totalRaised >= sale.hardCap) {
            return 0;
        }
        return sale.hardCap - sale.totalRaised;
    }

    /**
     * @notice Returns all sales currently registered.
     */
    function getAllSales() external view returns (Sale[] memory) {
        Sale[] memory all = new Sale[](saleCount);
        for (uint256 i = 1; i <= saleCount; i++) {
            all[i - 1] = sales[i];
        }
        return all;
    }

    /**
     * @notice Returns whether user has claimed tokens.
     */
    function isClaimed(uint256 saleId, address user) external view returns (bool) {
        return claimed[saleId][user];
    }

    /**
     * @notice Returns whether user has refunded contribution.
     */
    function isRefunded(uint256 saleId, address user) external view returns (bool) {
        return refunded[saleId][user];
    }
}
