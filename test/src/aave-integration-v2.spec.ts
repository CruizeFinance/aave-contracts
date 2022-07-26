import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, BigNumber } from "ethers";
import { formatUnits, parseEther, parseUnits } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";

import { Impersonate } from "../utils/utilities";

describe("Test Token", function () {
  let signer: SignerWithAddress;
  let wrapper: Contract;
  let wethGateway: Contract;
  let token: Contract;
  let pool: Contract;
  let usdcAccount: SignerWithAddress;

  let borrowAmount: BigNumber;

  let usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  let weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  let usdcHolder = "0x72A53cDBBcc1b9efa39c834A540550e23463AAcB";

  before(async () => {
    [signer] = await ethers.getSigners();
    usdcAccount = await Impersonate(usdcHolder);

    const AaveWrapper = await ethers.getContractFactory("AaveWrapper", signer);
    token = await ethers.getContractAt("IERC20", usdc, signer);
    wrapper = await AaveWrapper.deploy();

    pool = await ethers.getContractAt(
      "IPoolV2",
      "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
      signer
    );
    wethGateway = await ethers.getContractAt(
      "IWETHGateway",
      "0xcc9a0B7c43DC2a5F023Bb9b738E45B0Ef6B06E04",
      signer
    );

    hre.tracer.nameTags[signer.address] = "ADMIN";
    hre.tracer.nameTags[wrapper.address] = "TEST-TOKEN";
    hre.tracer.nameTags[usdcAccount.address] = "USDC-HOLDER";
  });

  it("ETH Supply", async function () {
    await wethGateway.depositETH(pool.address, signer.address, "0", {
      value: parseEther("2"),
    }); // 2
    await wethGateway.depositETH(pool.address, signer.address, "0", {
      value: parseEther("2"),
    }); // 2
    // console.log(await pool.callStatic.getUserAccountData(signer.address))

    const data = await pool.callStatic.getReserveData(weth);
    const aToken = await ethers.getContractAt(
      "IERC20",
      data.aTokenAddress,
      signer
    );
    const dToken = await ethers.getContractAt(
      "IERC20",
      data.variableDebtTokenAddress,
      signer
    );
    console.log({
      usdc: await token.callStatic.balanceOf(signer.address),
      aWeth: await aToken.callStatic.balanceOf(signer.address),
      debtWeth: await dToken.callStatic.balanceOf(signer.address),
    });
  });

  it("Borrow USDC", async function () {
    const userData = await pool.callStatic.getUserAccountData(signer.address);
    borrowAmount = userData.availableBorrowsBase
      .mul(BigNumber.from("20"))
      .div(BigNumber.from("10000"));
    await pool
      .connect(signer)
      .borrow(usdc, borrowAmount, "2", "0", signer.address);

    console.log(await pool.callStatic.getUserAccountData(signer.address));

    const wethData = await pool.callStatic.getReserveData(weth);
    const usdcData = await pool.callStatic.getReserveData(usdc);
    const aToken = await ethers.getContractAt(
      "IERC20",
      wethData.aTokenAddress,
      signer
    );

    const aUSDCToken = await ethers.getContractAt(
      "IERC20",
      usdcData.aTokenAddress,
      signer
    );

    const dToken = await ethers.getContractAt(
      "IERC20",
      wethData.variableDebtTokenAddress,
      signer
    );
    console.log({
      usdc: await token.callStatic.balanceOf(signer.address),
      aUSDC: await aUSDCToken.callStatic.balanceOf(signer.address),
      aWeth: await aToken.callStatic.balanceOf(signer.address),
      debtWeth: await dToken.callStatic.balanceOf(signer.address),
    });
  });

  it("Repay USDC", async function () {
    await token.approve(
      pool.address,
      BigNumber.from(
        "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      )
    );
      
    await pool.connect(signer).repay(usdc, borrowAmount, "2",signer.address);

    const wethData = await pool.callStatic.getReserveData(weth);
    const usdcData = await pool.callStatic.getReserveData(usdc);
    const aToken = await ethers.getContractAt(
      "IERC20",
      wethData.aTokenAddress,
      signer
    );

    const aUSDCToken = await ethers.getContractAt(
      "IERC20",
      usdcData.aTokenAddress,
      signer
    );

    const dToken = await ethers.getContractAt(
      "IERC20",
      wethData.variableDebtTokenAddress,
      signer
    );
    console.log({
      usdc: await token.callStatic.balanceOf(signer.address),
      aUSDC: await aUSDCToken.callStatic.balanceOf(signer.address),
      aWeth: await aToken.callStatic.balanceOf(signer.address),
      debtWeth: await dToken.callStatic.balanceOf(signer.address),
    });
  });

  it("Withdraw Eth", async function () {

    console.log(await pool.callStatic.getUserAccountData(signer.address))

    const data = await pool.callStatic.getReserveData(weth);
    const aToken = await ethers.getContractAt(
      "IERC20",
      data.aTokenAddress,
      signer
    );
    const dToken = await ethers.getContractAt(
      "IERC20",
      data.variableDebtTokenAddress,
      signer
    );

    await pool.connect(signer).withdraw(weth, parseEther("3.98"),signer.address);

    console.log({
      usdc: await token.callStatic.balanceOf(signer.address),
      aWeth: await aToken.callStatic.balanceOf(signer.address),
      debtWeth: await dToken.callStatic.balanceOf(signer.address),
    });


  });
});