// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title BotToken
 * @dev Standard ERC-20 token for project tokens deployed and launched via BotLaunchpad.
 */
contract BotToken is ERC20 {
    /**
     * @dev Constructor that mints an initial supply to a designated recipient.
     * @param name_ Token Name (e.g. "Nova Token")
     * @param symbol_ Token Symbol (e.g. "NOVA")
     * @param initialSupply Amount of tokens to mint (in base units, e.g. 1,000,000 * 10^18)
     * @param recipient Address to receive the minted supply
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply,
        address recipient
    ) ERC20(name_, symbol_) {
        require(recipient != address(0), "Invalid recipient");
        require(initialSupply > 0, "Supply must be positive");
        _mint(recipient, initialSupply);
    }
}
