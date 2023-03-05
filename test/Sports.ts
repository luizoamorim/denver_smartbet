import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect, assert } from "chai";
import { Contract, ContractFactory, BigNumber } from "ethers";
import { ethers } from "hardhat";

const toWei = (num: any) => num * 10 ** 6;
const fromWei = (num: any) => num / 10 ** 6;

describe("MGD Smart Contract", function () {
  let Sports: ContractFactory;
  let sports: Contract;

  let deployer: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addr4: SignerWithAddress;
  let addr5: SignerWithAddress;
  let addrs: SignerWithAddress[];

  let teamA = "Team A";
  let teamB = "Team B";
  let gameTime = 10;

  beforeEach(async function () {
    // Get the ContractFactories and Signers here.
    Sports = await ethers.getContractFactory("Sports");
    [deployer, addr1, addr2, addr3, addr4, addr5, ...addrs] =
      await ethers.getSigners();

    // To deploy our contracts
    sports = await Sports.deploy(
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
  });

  // describe("Deployment", function () {
  //   it("SShould contract owner be equal to deployer address", async function () {
  //     expect(await sports.contractOwner()).to.equal(deployer.address);
  //   });
  // });

  describe("Add game", function () {
    it("Should be possible to add a game in the games mapping", async function () {
      expect(await sports.addGame(teamA, teamB, gameTime))
        .to.emit(sports, "GameCreated")
        .withArgs(teamA, teamB, gameTime);
    });
  });

  describe("Make a bet", function () {
    let gameId: any;
    let teamAScore: any;
    let teamBScore: any;

    beforeEach(async () => {
      gameId = 0;
      teamAScore = 100;
      teamBScore = 99;
      await sports.addGame(teamA, teamB, gameTime);
    });

    it("Should be possible to make a bet in some existent game", async function () {
      let value = 1;
      expect(
        await sports.connect(addr1).makeBet(gameId, teamAScore, teamBScore, {
          value: toWei(value),
        })
      )
        .to.emit(sports, "BetCreated")
        .withArgs(gameId, teamAScore, teamBScore);
      // let cont = 0;
      // let bets = [];
      // do {
      //   cont++;
      //   bets.push(await sports.betsByGame(0, cont));
      // } while ((await sports.betsByGame(0, cont)) == !undefined);

      // console.log("BETS: ", bets[0]);
      // Verifying if the data match with the bet made
      let betMade = await sports.betsByGame(0, 0);
      console.log("BET MADE: ", betMade.gameId);
      expect(betMade.homeScore).to.be.equal(
        BigNumber.from(teamAScore.toString())
      );
      expect(betMade.awayScore).to.be.equal(
        BigNumber.from(teamBScore.toString())
      );
    });

    it("Should the fees be correctly distributed. 5% for the owner, 60% for the game and the rest for the lottery", async function () {
      let value = 10;
      let deployerAmountBefore = await deployer.getBalance();
      expect(
        await sports.connect(addr1).makeBet(gameId, teamAScore, teamBScore, {
          value: toWei(value),
        })
      )
        .to.emit(sports, "BetCreated")
        .withArgs(gameId, teamAScore, teamBScore);

      let deployerAmountAfter = await deployer.getBalance();
      // Contract owner balance should be incremented by 5% of the bet
      assert.approximately(
        +fromWei(deployerAmountAfter) - +fromWei(deployerAmountBefore),
        value / 20,
        100000
      );

      let game = await sports.games(0);
      // Game lottery should have incremented by 20%
      expect(+fromWei(game.lotteryPool)).to.be.equal(value / 5);

      expect(+fromWei(game.betsAmount)).to.be.equal(
        value - value / 5 - value / 20
      );
    });
  });

  // describe("Shuffle the bets and lottery", function () {
  //   let gameId: any;
  //   let winnersTeamAScore: any;
  //   let winnersTeamBScore: any;
  //   let loosersTeamAScore: any;
  //   let loosersTeamBScore: any;

  //   beforeEach(async () => {
  //     gameId = 0;
  //     winnersTeamAScore = 100;
  //     winnersTeamBScore = 50;
  //     loosersTeamAScore = 100;
  //     loosersTeamBScore = 70;
  //     await sports.addGame(teamA, teamB, gameTime);
  //   });

  //   it("Should have at least two winners of the game and one winner for the lottery", async function () {
  //     let value = 10;
  //     let numberOfBets = 4;
  //     let betsAmount = value * numberOfBets;
  //     let numberOfWinners = 2;
  //     let lotteryPremium = betsAmount / 20;
  //     let ownerFee = betsAmount / 5;
  //     let winnerAmount = betsAmount - ownerFee - lotteryPremium;
  //     let amountByWiner = winnerAmount / numberOfWinners;

  //     await sports
  //       .connect(addr5)
  //       .makeBet(gameId, winnersTeamAScore, winnersTeamBScore, {
  //         value: toWei(value),
  //       });

  //     await sports
  //       .connect(addr2)
  //       .makeBet(gameId, winnersTeamAScore, winnersTeamBScore, {
  //         value: toWei(value),
  //       });

  //     await sports
  //       .connect(addr3)
  //       .makeBet(gameId, loosersTeamAScore, loosersTeamBScore, {
  //         value: toWei(value),
  //       });

  //     await sports
  //       .connect(addr4)
  //       .makeBet(gameId, loosersTeamAScore, loosersTeamBScore, {
  //         value: toWei(value),
  //       });

  //     let addr2BalanceBefore = await addr2.getBalance();
  //     let addr3BalanceBefore = await addr3.getBalance();
  //     let addr4BalanceBefore = await addr4.getBalance();
  //     let addr5BalanceBefore = await addr5.getBalance();

  //     await sports.updateGameScore(0, 100, 50);

  //     let addr5BalanceAfter = await addr5.getBalance(); // Should be plus 37.5%
  //     let addr2BalanceAfter = await addr2.getBalance(); // Should be plus 37.5%
  //     let addr3BalanceAfter = await addr3.getBalance(); // Maybe winner of lottery
  //     let addr4BalanceAfter = await addr4.getBalance(); // Maybe winner of lottery

  //     expect(
  //       +fromWei(addr5BalanceAfter) - +fromWei(addr5BalanceBefore)
  //     ).to.be.equal(amountByWiner);

  //     expect(
  //       +fromWei(addr2BalanceAfter) - +fromWei(addr2BalanceBefore)
  //     ).to.be.equal(amountByWiner);

  //     console.log(
  //       "TESTE 3: ",
  //       +fromWei(addr3BalanceAfter) - +fromWei(addr3BalanceBefore)
  //     );
  //     console.log(
  //       "TESTE 3 BEFORE: ",
  //       +fromWei(addr3BalanceAfter) - +fromWei(addr3BalanceBefore)
  //     );
  //     console.log(
  //       "TESTE 3 AFTER: ",
  //       +fromWei(addr3BalanceAfter) - +fromWei(addr3BalanceBefore)
  //     );
  //     console.log(
  //       "TESTE 4: ",
  //       +fromWei(addr4BalanceAfter) - +fromWei(addr4BalanceBefore)
  //     );
  //     expect(lotteryPremium).to.be.oneOf([
  //       +fromWei(addr3BalanceAfter) - +fromWei(addr3BalanceBefore),
  //       +fromWei(addr4BalanceAfter) - +fromWei(addr4BalanceBefore),
  //     ]);
  //   });
  // });
});
