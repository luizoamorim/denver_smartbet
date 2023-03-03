require("dotenv").config();
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";

import { HardhatUserConfig } from "hardhat/config";

const myPrivateKey: string = process.env.MY_PRIVATE_KEY as string;
const myInfuraId: string = process.env.INFURA_ID as string;

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  paths: {
    artifacts: "./webapp",
  },
  networks: {
    hardhat: {
      chainId: 1337,
      gasPrice: 100000000000, // 100 gwei
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${myInfuraId}`,
      accounts: [myPrivateKey],
    },
  },
};

export default config;
