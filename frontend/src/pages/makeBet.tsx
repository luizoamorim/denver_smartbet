import Image from "next/image";
import logo from "../../public/assets/logo.svg";
import { useEffect, useState } from "react";
import SportsABI from "../../artifacts/contracts/Sports.sol/Sports.json";
import USDCABI from "../utils/abis/USDC.json";
import Web3 from "web3";
import magic from "../utils/magic";
import { useRouter } from "next/router";
import ethers from "ethers";

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
export default function MakeBet({ query }: any) {
    const obj = JSON.parse(query.obj);
    const [address, setAddress] = useState("");
    const router = useRouter();
    const [inputAValue, setInputAValue] = useState("");
    const [inputBValue, setInputBValue] = useState("");
    const [inputBetValue, setInputBetValue] = useState("");

    useEffect(() => {
        getBetsByGame();
        const storedAddress = localStorage.getItem("walletAddress");
        if (!storedAddress) {
            router.push("/login");
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

    const getBetsByGame = async () => {
        const web3 = new Web3(magic.rpcProvider as any);
        const address = (await web3.eth.getAccounts())[0];
        console.log("ADDRESS: ", address);
        const contract = new web3.eth.Contract(
            SportsABI.abi as any,
            "0x2f648fc2445bB5F60E8A41Ea573a750455EcCab8",
        );
        let cont = 0;
        let bets = [];
        do {
            cont++;
            bets.push(
                await contract.methods
                    .betsByGame(obj.game?.gameId, cont)
                    .call(),
            );
        } while (
            (await contract.methods.betsByGame(obj.game?.gameId, cont)) ==
            !undefined
        );

        console.log("BETS: ", bets);
    };

    const makeBet = async () => {
        console.log("ENTRA!!");
        const web3 = new Web3(magic.rpcProvider as any);
        const address = (await web3.eth.getAccounts())[0];
        console.log("ADDRESS: ", address);
        const contract = new web3.eth.Contract(
            SportsABI.abi as any,
            "0x2f648fc2445bB5F60E8A41Ea573a750455EcCab8",
        );

        console.log("CONTRATO: ", contract);

        const usdcContract = new web3.eth.Contract(
            USDCABI as any,
            "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23",
        );

        console.log("SO PARA TESTAR: ", toUSDC(parseFloat(inputBetValue)));

        const usdcTxn = await usdcContract.methods
            .approve("0x2f648fc2445bB5F60E8A41Ea573a750455EcCab8", 10000)
            .send({ from: address });

        contract.methods
            .makeBet(obj.game?.gameId, inputAValue, inputBValue, 10000)
            .send({
                from: address,
                value: 0,
                gasPrice: web3.utils.toWei("10", "gwei"),
                gasLimit: 300000,
            })
            .then((receipt: any) => {
                console.log("Transaction receipt:", receipt);
            })
            .catch((error: any) => {
                console.error("Error:", error);
            });
    };
    return (
        <div style={{ height: "100%" }}>
            <div className="w-full h-32 p-8 bg-appred-250 flex items-center justify-between">
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
                        <div
                            className="bg-red-400 hover:cursor-pointer w-14 h-14 ml-2 rounded flex items-center justify-center text-white"
                            onClick={() => logoutMagicLink()}
                        >
                            Exit
                        </div>
                    )}
                    <div
                        className="bg-blue-700 hover:cursor-pointer w-14 h-14 ml-2 rounded flex items-center justify-center text-white"
                        onClick={() => makeBet()}
                    >
                        Bet
                    </div>
                </div>
            </div>
            <div
                className="flex h-96 justify-center p-10 w-full bg-no-repeat bg-cover bg-[url(../../public/assets/betEarn.svg)]"
                style={{ height: "100%" }}
            >
                <div className="w-3/12 h-5/12 flex flex-col justify-around items-center rounded-3xl bg-white p-3 hover:bg-inchworm px-24">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-200 p-4">Item 1</div>
                        <div className="bg-gray-200 p-4">Item 2</div>
                        <div className=" p-4">{obj.game!.teamA}</div>
                        <div className=" p-4">{obj.game!.teamB}</div>
                    </div>
                    <div className="flex w-full justify-between items-center">
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
                    <div className="flex items-center border-2 border-gray-300 rounded-md ">
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
                    <div className="w-10/12 h-60 mt-4 flex flex-col rounded-3xl bg-white p-6 hover:bg-inchworm">
                        <p className="text-3xl font-bold">Bets History</p>
                        <div className="flex mt-10 justify-around w-full border-b-2">
                            <p className="flex justify-center items-center">
                                Address
                            </p>
                            <p>Result</p>
                            <p>Time</p>
                            <p>Amont</p>
                        </div>
                        <div className="flex mt-4 justify-around w-full">
                            <p>0x9d3da2b...de5f</p>
                            <p>100 X 10</p>
                            <p>03/01/2023 7pm</p>
                            <p>1 USDC</p>
                        </div>
                    </div>
                    <div className="w-full flex justify-center items-center mt-24">
                        <div className="w-4/12 h-60 flex flex-col mr-24 rounded-3xl bg-white p-6 hover:bg-inchworm">
                            <p className="text-3xl font-bold">
                                Game Bet Winners
                            </p>
                            <div className="flex mt-10 justify-around w-full border-b-2">
                                <p className="flex justify-center items-center">
                                    Address
                                </p>
                            </div>
                            <div className="flex mt-4 justify-around w-full">
                                <p>0x9d3da2b...de5f</p>
                            </div>
                            <div className="flex mt-4 justify-around w-full">
                                <p>0x9d3da2b...de5f</p>
                            </div>
                        </div>
                        <div className="w-4/12 h-60 flex flex-col rounded-3xl bg-white p-6 hover:bg-inchworm">
                            <p className="text-3xl font-bold">
                                Lottery Winners
                            </p>
                            <div className="flex mt-10 justify-around w-full border-b-2">
                                <p className="flex justify-center items-center">
                                    Address
                                </p>
                            </div>
                            <div className="flex mt-4 justify-around w-full">
                                <p>0x9d3da2b...de5f</p>
                            </div>
                            <div className="flex mt-4 justify-around w-full">
                                <p>0x9d3da2b...de5f</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export async function getServerSideProps(context: any) {
    return { props: { query: context.query } };
}
