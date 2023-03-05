import Image from "next/image";
import logo from "../../public/assets/logo.svg";
import { useEffect, useState } from "react";
import SportsABI from "../../artifacts/contracts/Sports.sol/Sports.json";
import USDCABI from "../utils/abis/USDC.json";
import Web3 from "web3";
import magic from "../utils/magic";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import moment from "moment-timezone";
import env from "@/deployment/env";
import getSportsABI from "@/utils/getSportsABI";

interface GameCardProps {
    gameId: number;
    date: string;
    teamA: string;
    teamB: string;
    betQt: string;
}

function toUSDC(num: number): number {
    return num * 10 ** 6;
}

function fromUSDC(num: number): number {
    return num / 10 ** 6;
}
export default function MakeBet({
    query,
    bets,
    gameConverted,
    sportsABI,
}: any) {
    const obj = JSON.parse(query.obj);
    const [address, setAddress] = useState("");
    const router = useRouter();
    const [inputAValue, setInputAValue] = useState("");
    const [inputBValue, setInputBValue] = useState("");
    const [inputBetValue, setInputBetValue] = useState("");
    const [stateBets, setStateBets] = useState<any[]>(bets);
    const [stateGameConverted, setStateGameConverted] =
        useState<any>(gameConverted);
    const [winnerLottery, setWinnerLottery] = useState();

    useEffect(() => {
        const getLot = async () => {
            const web3 = new Web3(magic.rpcProvider as any);
            const address = (await web3.eth.getAccounts())[0];
            const contract = new web3.eth.Contract(
                sportsABI.abi as any,
                env.SMARTBET_CONTRACT_ADDRESS,
            );
            setWinnerLottery(
                await contract.methods
                    .loterryWinners(gameConverted.gameId)
                    .call(),
            );
        };
        getLot();

        const storedAddress = localStorage.getItem("walletAddress");
        if (!storedAddress) {
            router.push("/");
        }
        setAddress(storedAddress as string);
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

    function handleInputAChange(event: any) {
        setInputAValue(event.target.value);
    }

    function handleInputBChange(event: any) {
        setInputBValue(event.target.value);
    }

    function handleInputBetChange(event: any) {
        setInputBetValue(event.target.value);
    }

    const refreshBetsList = async () => {
        const web3 = new Web3(magic.rpcProvider as any);
        const address = (await web3.eth.getAccounts())[0];
        const contract = new web3.eth.Contract(
            sportsABI.abi as any,
            env.SMARTBET_CONTRACT_ADDRESS,
        );
        setStateBets([
            ...stateBets,
            await contract.methods
                .betsByGame(obj.game?.gameId, stateBets.length + 1)
                .call(),
        ]);
    };

    const makeBet = async () => {
        const web3 = new Web3(magic.rpcProvider as any);
        const address = (await web3.eth.getAccounts())[0];
        const contract = new web3.eth.Contract(
            sportsABI.abi as any,
            env.SMARTBET_CONTRACT_ADDRESS,
        );

        const usdcContract = new web3.eth.Contract(
            USDCABI as any,
            env.USDC_CONTRACT_ADDRESS,
        );

        const usdcTxn = await usdcContract.methods
            .approve(
                env.SMARTBET_CONTRACT_ADDRESS,
                toUSDC(parseFloat(inputBetValue)),
            )
            .send({ from: address });

        contract.methods
            .makeBet(
                obj.game?.gameId,
                inputAValue,
                inputBValue,
                toUSDC(parseFloat(inputBetValue)),
            )
            .send({
                from: address,
                value: 0,
                gasPrice: web3.utils.toWei("10", "gwei"),
                gasLimit: 300000,
            })
            .then((receipt: any) => {
                web3.eth
                    .getTransactionReceipt(receipt.transactionHash)
                    .then(async () => {
                        router.reload();
                        setStateGameConverted(
                            await contract.methods.games(gameConverted.gameId),
                        );
                    });
            })
            .catch((error: any) => {
                console.error("Error:", error);
            });
    };

    const itemList = bets.map((bet: any, index: number) => (
        <div
            key={index}
            className="grid grid-cols-3 mt-4 justify-around w-full text-xl"
        >
            <p>
                {bet.user.slice(0, 5)}...
                {bet.user.slice(bet.user.length - 4, bet.user.length)}
            </p>
            <p>
                {bet.homeScore} X {bet.awayScore}
            </p>
            <p>{fromUSDC(parseFloat(bet.amount))} USDC</p>
        </div>
    ));

    function handleHome() {
        router.push("/");
    }

    return (
        <div>
            <div className="w-full h-32 p-8 bg-appred-250 flex items-center justify-between">
                <div
                    className="hover:cursor-pointer"
                    onClick={() => handleHome()}
                >
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
                </div>
            </div>
            <div
                className="flex p-5 w-full bg-no-repeat bg-cover bg-[url(../../public/assets/betEarn.svg)]"
                style={{ height: "850px" }}
            >
                <div className="w-4/12 h-96 flex flex-col justify-center items-center rounded-3xl bg-white bg-opacity-95 hover:bg-inchworm p-10">
                    <div className="flex w-full justify-around">
                        <div className="flex flex-col items-center justify-center">
                            <Image
                                src={stateGameConverted.teamAImage}
                                alt="an team immage"
                                width={56}
                                height={56}
                                className="rounded-xl"
                            />
                            <div className="w-full">
                                {stateGameConverted.teamA}
                            </div>
                        </div>
                        <div></div>
                        <div className="flex flex-col items-center justify-center">
                            <Image
                                src={stateGameConverted.teamBImage}
                                alt="an team immage"
                                width={56}
                                height={56}
                                className="rounded-xl"
                            />
                            <div className="w-full">
                                {stateGameConverted.teamB}
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full justify-around items-center px-4">
                        <input
                            type="text"
                            className="border-2 border-gray-300 bg-white bg-opacity-50 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24 h-12"
                            value={inputAValue}
                            onChange={handleInputAChange}
                        />

                        <p className="m-8 text-3xl font-bold">X</p>
                        <input
                            type="text"
                            className="border-2 border-gray-300 bg-white bg-opacity-50 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24 h-12"
                            value={inputBValue}
                            onChange={handleInputBChange}
                        />
                    </div>
                    <div className="flex items-center border-2 border-gray-300 rounded-md mb-8 ">
                        <p className="h-12 flex justify-center items-center bg-gray-100 px-4">
                            USDC
                        </p>
                        <input
                            type="text"
                            className=" bg-white bg-opacity-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:rounded-md w-full h-12"
                            value={inputBetValue}
                            onChange={handleInputBetChange}
                        />
                    </div>
                    <div
                        className="bg-appred-200 w-72 h-9 flex justify-center items-center text-white
           font-bold rounded-md hover:bg-appred-250 hover:cursor-pointer"
                        onClick={() => makeBet()}
                    >
                        Bet Now
                    </div>
                </div>
                <div className="flex flex-col w-full items-center">
                    <div className="w-10/12 h-96 flex flex-col text-center rounded-3xl bg-white bg-opacity-90 p-6 hover:bg-inchworm">
                        <p className="flex justify-center text-3xl font-bold">
                            Bets History
                        </p>
                        <div className="grid grid-cols-3 mt-10 justify-around w-full border-b-2">
                            <p className="font-bold text-gray-900">Address</p>
                            <p className="font-bold text-gray-900">Result</p>
                            <p className="font-bold text-gray-900">Amont</p>
                        </div>
                        <div className="overflow-y-auto">
                            {stateBets && itemList}
                            {!stateBets && (
                                <div className="flex mt-4 justify-around w-full">
                                    <p>Loading ...</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {!obj.game.gameCompleted && (
                        <div className="w-full flex justify-center items-center mt-10">
                            <div className="w-4/12 h-60 flex flex-col mr-10 rounded-3xl bg-opacity-90 bg-white p-6 hover:bg-inchworm">
                                <p className="flex justify-center items-center text-2xl font-bold">
                                    Game Bet Amount
                                </p>
                                <div className="flex justify-center items-center h-full">
                                    <div className="flex items-end">
                                        <p className="text-5xl font-bold text-gray-900">
                                            {fromUSDC(gameConverted.betsAmount)}
                                        </p>
                                        <p className="text-xl font-bold ml-1">
                                            USDC
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="w-4/12 h-60 flex flex-col rounded-3xl bg-white bg-opacity-90 p-6 hover:bg-inchworm">
                                <p className="flex justify-center items-center text-3xl font-bold">
                                    Lottery Amount
                                </p>
                                <div className="flex justify-center items-center h-full">
                                    <div className="flex items-end">
                                        <p className="text-5xl font-bold">
                                            {fromUSDC(
                                                gameConverted.lotteryPool,
                                            )}
                                        </p>
                                        <p className="text-2xl font-bold ml-1">
                                            USDC
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {obj.game.gameCompleted && (
                        <div className="w-full flex justify-center items-center mt-24">
                            <div className="w-4/12 h-60 flex flex-col mr-24 rounded-3xl bg-white bg-opacity-90 p-6 hover:bg-inchworm">
                                <p className="flex justify-center items-center text-3xl font-bold">
                                    Game Bet Winners
                                </p>
                                <div className="flex mt-10 justify-around w-full border-b-2">
                                    <p className="flex justify-center items-center">
                                        Address
                                    </p>
                                </div>
                                {bets.map((bet: any, index: number) => {
                                    {
                                        bet.betWon && <div key={index}></div>;
                                    }
                                })}
                            </div>
                            <div className="w-4/12 h-60 flex flex-col rounded-3xl bg-white bg-opacity-90 p-6 hover:bg-inchworm">
                                <p className="flex justify-center items-center text-3xl font-bold">
                                    Lottery Winners
                                </p>
                                <div className="flex mt-10 justify-center w-full border-b-2">
                                    <p className="flex justify-center items-center">
                                        Address
                                    </p>
                                    <p>{winnerLottery}</p>
                                </div>
                                <div>{}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export async function getServerSideProps(context: any) {
    const web3 = new Web3(
        `https://polygon-mumbai.infura.io/v3/${env.INFURA_ID}`,
    );
    const SportsABI = await getSportsABI();

    const contract = new web3.eth.Contract(
        SportsABI.abi as any,
        env.SMARTBET_CONTRACT_ADDRESS,
    );

    const obj = JSON.parse(context.query.obj);
    const gameConverted = {
        gameId: obj.game?.gameId,
        date: moment(web3.utils.hexToAscii(obj.game!.date)),
        teamA: web3.utils.hexToAscii(obj.game!.teamA),
        teamAImage: web3.utils.hexToAscii(obj.game!.teamAImage),
        teamB: web3.utils.hexToAscii(obj.game!.teamB),
        teamBImage: web3.utils.hexToAscii(obj.game!.teamBImage),
        betQt: obj.game!.betQt,
        gameCompleted: obj.game!.gameCompleted,
        lotteryPool: obj.game!.lotteryPool,
        betsAmount: obj.game!.betsAmount,
    };

    let cont = 0;
    let bets = [];
    while (
        (await contract.methods.betsByGame(obj.game?.gameId, cont).call())
            .user !== "0x0000000000000000000000000000000000000000"
    ) {
        bets.push(
            await contract.methods.betsByGame(obj.game?.gameId, cont).call(),
        );
        cont++;
    }

    return {
        props: {
            query: context.query,
            bets: JSON.parse(JSON.stringify(bets)),
            gameConverted: JSON.parse(JSON.stringify(gameConverted)),
            sportsABI: JSON.parse(JSON.stringify(SportsABI)),
        },
    };
}
