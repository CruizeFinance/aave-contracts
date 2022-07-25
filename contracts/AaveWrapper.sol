pragma solidity 0.8.10;

import "./interfaces/IPool.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IPoolAddressesProvider.sol";
import "hardhat/console.sol";
import "./PercentageMath.sol";

contract AaveWrapper {
    using PercentageMath for uint256;

    IPool public constant POOL =
        IPool(address(0x794a61358D6845594F94dc1DB02A252b5b4814aD));

    IPoolAddressesProvider public constant POOL_ADDRESS_PROVIDER =
        IPoolAddressesProvider(
            address(0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb)
        );
    IERC20 public constant SUPPLY_ASSET =
        IERC20(address(0x7F5c764cBc14f9669B88837ca1490cCa17c31607)); // USDC
    IERC20 public constant BORROW_ASSET =
        IERC20(address(0x94b008aA00579c1307B0EF2c499aD98a8ce58e58)); // USDT

    function deposit(uint256 amount) public {
        SUPPLY_ASSET.transferFrom(msg.sender, address(this), amount);
        SUPPLY_ASSET.approve(address(POOL), amount);
        POOL.setUserEMode(1);
        // Supply to pool
        POOL.supply(address(SUPPLY_ASSET), amount, address(this), 0);
    }

    function borrow(uint256 amount) public {
        // Borrow to pool
        POOL.borrow(address(BORROW_ASSET), amount, 2, 0, address(this));
    }

    function repay(uint256 amount) public {
      BORROW_ASSET.approve(address(POOL), amount);
      POOL.repay(address(BORROW_ASSET), amount, 2, address(this));
    }
}
