import Image from "next/image";
import logo from "../../public/assets/logo.svg";
import { useEffect, useState } from "react";
import SportsABI from "../../artifacts/contracts/Sports.sol/Sports.json";
import Web3 from "web3";
import magic from "../utils/magic";
import GameCard from "@/components/gameCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import main from "@/deployment/env";

export default function Home(props: any) {
    const [address, setAddress] = useState("");
    const [games, setGames] = useState([]);

    useEffect(() => {
        main();
        const storedAddress = localStorage.getItem("walletAddress");
        if (storedAddress) {
            setAddress(storedAddress);
        }
    }, []);
    const loginWithMagicLink = async () => {
        const accounts = await magic.wallet.connectWithUI();
        localStorage.setItem("walletAddress", accounts[0]);
        setAddress(accounts[0]);
    };

    const logoutMagicLink = async () => {
        await magic.wallet.disconnect();
        localStorage.removeItem("walletAddress");
        setAddress("");
    };

    const createGame = async () => {
        const web3 = new Web3(magic.rpcProvider as any);
        const address = (await web3.eth.getAccounts())[0];
        console.log("ADDRESS: ", address);
        const contract = new web3.eth.Contract(
            SportsABI.abi as any,
            process.env.NEXT_PUBLIC_SMARTBET_CONTRACT_ADDRESS,
        );

        // const homeTeam = "Denver Nuggets";
        // const homeTeamImage =
        //     "https://loodibee.com/wp-content/uploads/nba-denver-nuggets-logo-2018-300x300.png";
        // const awayTeam = "Miami Heat";
        // const awayTeamImage =
        //     "https://loodibee.com/wp-content/uploads/nba-miami-heat-logo-300x300.png";
        // const gameTime = "2023-03-10T12:30:00.000Z";
        contract.methods
            .addGamesFromAPI()
            .send({ from: "0x929a4dfc610963246644b1a7f6d1aed40a27dd2f" })
            .then((receipt: any) => {
                console.log("OK: ", receipt);
            })
            .catch((error: any) => {
                console.log("Error: ", error);
            });
    };

    const showGame = async () => {
        const web3 = new Web3(magic.rpcProvider as any);
        const address = (await web3.eth.getAccounts())[0];
        console.log("ADDRESS: ", address);
        const contract = new web3.eth.Contract(
            SportsABI.abi as any,
            process.env.NEXT_PUBLIC_SMARTBET_CONTRACT_ADDRESS,
        );

        let cont = 0;
        let games: any[] = [];
        do {
            games.push(await contract.methods.games(cont).call());
            cont++;
        } while (
            (await contract.methods.games(cont).call()).homeTeam.length !== 0
        );

        setGames(games as any);
    };

    const makeBet = async () => {
        const web3 = new Web3(magic.rpcProvider as any);
        const address = (await web3.eth.getAccounts())[0];
        console.log("ADDRESS: ", address);
        const contract = new web3.eth.Contract(
            SportsABI.abi as any,
            process.env.NEXT_PUBLIC_SMARTBET_CONTRACT_ADDRESS,
        );
        console.log("CONTRACT: ", contract);
        // const signer = await provider.getSigner();
        // console.log("SIGNER TYPE: ", typeof signer);
        // console.log("SIGNER: ", signer);
        // const contract = new ethers.Contract(
        //     "0x2397FE9f5e4eeC692B7af2c08728B5D02c7a7c9a",
        //     SportsABI,
        //     magic.rpcProvider,
        // );
    };

    const itemList = props.games.map((game: any, index: number) => (
        <GameCard
            gameId={index}
            teamA={game.homeTeam}
            teamAImage={game.homeTeamImage}
            teamB={game.awayTeam}
            teamBImage={game.awayTeamImage}
            date={game.gameTime}
            betQt={game.betsCount}
            gameCompleted={game.gameCompleted}
            betsAmount={game.betsAmount}
            lotteryPool={game.lotteryPool}
        />
    ));

    return (
        <div style={{ height: "100%" }}>
            <div className="h-32 p-8 bg-appred-100 flex items-center justify-between">
                <div>
                    <Image
                        src={logo}
                        alt="Logo of the application"
                        width={350}
                        height={322}
                        priority
                    ></Image>
                </div>
                <div className="flex justify-center items-center">
                    <div
                        className="bg-apporange-100 hover:bg-apporange-200 hover:cursor-pointer w-40 h-14 rounded flex items-center justify-center text-white"
                        onClick={() => loginWithMagicLink()}
                    >
                        {address && (
                            <p>
                                {address.slice(0, 5)}...
                                {address.slice(
                                    address.length - 4,
                                    address.length,
                                )}
                            </p>
                        )}
                        {!address && <p>ConnectWallet</p>}
                    </div>
                    {address && (
                        <FontAwesomeIcon
                            className="w-10 ml-4 text-white hover:text-red-700 hover:cursor-pointer"
                            icon={faSignOutAlt}
                            onClick={() => logoutMagicLink()}
                            title="logout"
                        />
                    )}
                    <div
                        className="bg-blue-700 hover:cursor-pointer w-14 h-14 ml-2 rounded flex items-center justify-center text-white"
                        onClick={() => makeBet()}
                    >
                        Bet
                    </div>
                    <div
                        className="bg-blue-700 hover:cursor-pointer w-14 h-14 ml-2 rounded flex items-center justify-center text-white"
                        onClick={() => createGame()}
                    >
                        Create Game
                    </div>
                    <div
                        className="bg-blue-700 hover:cursor-pointer w-14 h-14 ml-2 rounded flex items-center justify-center text-white"
                        onClick={() => showGame()}
                    >
                        Show Game
                    </div>
                </div>
            </div>
            <div
                className="flex justify-center w-full py-10 bg-no-repeat bg-cover bg-[url(../../public/assets/betEarn.svg)]"
                style={{ height: "850px" }}
            >
                <div className="grid grid-cols-4 gap-4">{itemList}</div>
            </div>
        </div>
    );
}

export async function getServerSideProps() {
    // Connect to the Ethereum network

    const web3 = new Web3(
        `https://polygon-mumbai.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`,
    );

    const contract = new web3.eth.Contract(
        SportsABI.abi as any,
        process.env.NEXT_PUBLIC_SMARTBET_CONTRACT_ADDRESS,
    );

    let cont = 0;
    let games: any[] = [];

    while ((await contract.methods.games(cont).call()).homeTeam !== null) {
        console.log("EXAMPLE: ", await contract.methods.games(cont).call());
        games.push(await contract.methods.games(cont).call());
        cont++;
    }

    return {
        props: {
            games: JSON.parse(JSON.stringify(games)),
        },
    };
}
