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

  let usdc = "0x7F5c764cBc14f9669B88837ca1490cCa17c31607";
  let weth = "0x4200000000000000000000000000000000000006";
  let usdcHolder = "0xa3f45e619cE3AAe2Fa5f8244439a66B203b78bCc";

  before(async () => {
    [signer] = await ethers.getSigners();
    usdcAccount = await Impersonate(usdcHolder);

    const AaveWrapper = await ethers.getContractFactory("AaveWrapper", signer);
    token = await ethers.getContractAt("IERC20", usdc, signer);
    wrapper = await AaveWrapper.deploy();

    pool = await ethers.getContractAt(
      "IPool",
      "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
      signer
    );
    wethGateway = await ethers.getContractAt(
      "IWETHGateway",
      "0x86b4D2636EC473AC4A5dD83Fc2BEDa98845249A7",
      signer
    );

    hre.tracer.nameTags[signer.address] = "ADMIN";
    hre.tracer.nameTags[wrapper.address] = "TEST-TOKEN";
    hre.tracer.nameTags[usdcAccount.address] = "USDC-HOLDER";
  });

  it.only("ETH Supply", async function () {
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

  it.only("Borrow USDC", async function () {
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

  it.only("Repay USDC", async function () {
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

  it.only("Withdraw Eth", async function () {

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