import { artifacts, ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get the ContractFactories and Signers here.
  const Sports = await ethers.getContractFactory("Sports");
  // deploy contracts
  const sports = await Sports.deploy(
    "0x326c977e6efc84e512bb9c30f76e30c160ed06fb",
    "0x40193c8518bb267228fc409a613bdbd8ec5a97b3",
    "0x6361393833363663633733313439353762386330313263373266303561656562",
    "0x3764383061363338366566353433613361626235323831376636373037653362",
    "0x326c977e6efc84e512bb9c30f76e30c160ed06fb",
    "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23",
    [],
    [
      "0x3b02935b6717b012f8240aa3a3a1be0ecd37b315",
      "0x929A4DfC610963246644b1A7f6D1aed40a27dD2f",
    ],
    "https://www.random.org/integers/?num=1&min=1&col=1&base=10&format=plain&rnd=new&max=",
    "https://nbamockapi-git-main-luizoamorim.vercel.app/upcoming-games"
  );
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
