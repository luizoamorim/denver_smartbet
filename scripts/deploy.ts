import { artifacts, ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get the ContractFactories and Signers here.
  const Sports = await ethers.getContractFactory("Sports");
  // deploy contracts
  const sports = await Sports.deploy(
    "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    [
      "0x40193c8518BB267228Fc409a613bDbD8eC5a97b3",
      "0x7ca7215c6B8013f249A195cc107F97c4e623e5F5",
    ],
    "0x6361393833363663633733313439353762386330313263373266303561656562",
    "0x3530636536353238663164623462376438383863616133666163323362373833",
    "0x6234616433323862323131663436626661303461623465313430323365363164",
    "0x34b312de0ac6544977971ff65843eaad951a215f",
    "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23",
    [
      "0x3B02935B6717b012f8240AA3a3A1Be0eCD37B315",
      "0x929A4DfC610963246644b1A7f6D1aed40a27dD2f",
    ],
    [
      "https://www.random.org/integers/?num=1&min=1&col=1&base=10&format=plain&rnd=new&max=",
      "https://nbamockapi-git-main-luizoamorim.vercel.app/upcoming-games",
      "https://nbamockapi-git-main-luizoamorim.vercel.app/resulting-games",
    ]
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
