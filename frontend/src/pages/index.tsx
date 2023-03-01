import { useState } from "react";
import { ethers } from "ethers";
import Sports from "../../../artifacts/contracts/Sports.sol/Sports.json";

export default function Home() {
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [gameId, setGameId] = useState<number>(0);

  const connectToProvider = async () => {
    if (window.ethereum) {
      const provider: any = new ethers.providers.Web3Provider(window.ethereum);
      await window.ethereum.enable();
      setProvider(provider);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        "0x633D0E740c63d36a503D59C6f8501aBAebdaE189",
        Sports.abi,
        signer
      );
      setContract(contract);
    } else {
      console.log("Ethereum not found");
    }
  };

  const handleBetAmountChange = (event: any) => {
    setBetAmount(event.target.value);
  };

  const handleHomeScoreChange = (event: any) => {
    setHomeScore(event.target.value);
  };

  const handleAwayScoreChange = (event: any) => {
    setAwayScore(event.target.value);
  };

  const handleGameIdChange = (event: any) => {
    setGameId(event.target.value);
  };

  const handlePlaceBet = async () => {
    if (!provider || !contract) {
      return;
    }

    const accounts = await provider.listAccounts();
    const gameIdInt = parseInt(gameId.toString(), 10);
    const betAmountWei = ethers.utils.parseEther(betAmount.toString());
    await contract.makeBet(gameIdInt, homeScore, awayScore, {
      value: betAmountWei,
    });
  };

  const handleCreateGame = async () => {
    if (!provider || !contract) {
      return;
    }
    const gameIdInt = parseInt(gameId.toString(), 10);
    const gameDateUnix = new Date().getTime() / 1000;
    await contract.addGame(gameIdInt, gameDateUnix, "A", "B");
  };

  const getGame = async () => {
    if (!provider || !contract) {
      return;
    }
    console.log("GAMEEEEE: ", await contract.games(0));
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <button className="p-10 bg-slate-500" onClick={connectToProvider}>
        Connect to Ethereum
      </button>
      <input
        type="number"
        placeholder="Bet amount"
        value={betAmount}
        onChange={handleBetAmountChange}
      />
      <input
        type="number"
        placeholder="Home score"
        value={homeScore}
        onChange={handleHomeScoreChange}
      />
      <input
        type="number"
        placeholder="Away score"
        value={awayScore}
        onChange={handleAwayScoreChange}
      />
      <input
        type="number"
        placeholder="Game ID"
        value={gameId}
        onChange={handleGameIdChange}
      />
      <button onClick={handlePlaceBet}>Place Bet</button>
      <button onClick={handleCreateGame}>Create a Game</button>
      <button onClick={getGame}>GET a Game</button>
    </div>
  );
}
