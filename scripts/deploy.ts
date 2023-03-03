import { artifacts, ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get the ContractFactories and Signers here.
  const Sports = await ethers.getContractFactory("Sports");
  // deploy contracts
  const sports = await Sports.deploy("0x326C977E6efc84E512bB9C30f76E30c160eD06FB", 
    "0xCC79157eb46F5624204f47AB42b3906cAA40eaB7", 
    "0x6361393833363663633733313439353762386330313263373266303561656562",
    "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
    [], 
    ["0x3B02935B6717b012f8240AA3a3A1Be0eCD37B315"], 
    "https://www.random.org/integers/?num=1&min=1&col=1&base=10&format=plain&rnd=new&max=",
    "https://www.random.org/integers/?num=1&min=1&col=1&base=10&format=plain&rnd=new&max=");
  console.log("Contract address:", sports.address);

  // Save copies of each contracts abi and address to the frontend.
  //saveFrontendFiles(mgd, "MGD");
  //saveFrontendFiles(gdnft, "GDNFT");
}

// function saveFrontendFiles(contract: any, name: string) {
//   const fs = require("fs");
//   const contractsDir = __dirname + "/../../frontend/contractsData";

//   if (!fs.existsSync(contractsDir)) {
//     fs.mkdirSync(contractsDir);
//   }

//   fs.writeFileSync(
//     contractsDir + `/${name}-address.json`,
//     JSON.stringify({ address: contract.address }, undefined, 2)
//   );

//   const contractArtifact = artifacts.readArtifactSync(name);

//   fs.writeFileSync(
//     contractsDir + `/${name}.json`,
//     JSON.stringify(contractArtifact, null, 2)
//   );
// }

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
