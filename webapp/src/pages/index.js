import Image from "next/image";
import { Inter } from "next/font/google";

import logo from "../../public/assets/logo.svg";
import { useEffect, useState } from "react";
import SportsABI from "../../../artifacts/contracts/Sports.sol/Sports.json";
import magic from "@/utils/magic";
import ethers from "ethers";
import Web3 from "web3";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
    const [address, setAddress] = useState("");

    useEffect(() => {
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

    const makeBet = async () => {
        // const provider = new ethers.JsonRpcProvider(
        //   `https://polygon-mumbai.infura.io/v3/${myInfuraId}`
        // );

        const web3 = new Web3(magic.rpcProvider);
        const address = (await web3.eth.getAccounts())[0];
        console.log("ADDRESS: ", address);
        const contract = new web3.eth.Contract(
            SportsABI.abi,
            "0x2397FE9f5e4eeC692B7af2c08728B5D02c7a7c9a",
        );
        console.log("CONTRACT: ", contract.methods.contractOwner());
        // const signer = await provider.getSigner();
        // console.log("SIGNER TYPE: ", typeof signer);
        // console.log("SIGNER: ", signer);
        // const contract = new ethers.Contract(
        //     "0x2397FE9f5e4eeC692B7af2c08728B5D02c7a7c9a",
        //     SportsABI,
        //     magic.rpcProvider,
        // );
    };
    return (
        <div>
            <div className="w-full h-32 p-8 bg-appred-100 flex items-center justify-between">
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
            <div className="flex justify-center items-center w-full h-96 bg-no-repeat bg-cover bg-[url(../../public/assets/betEarn.svg)]">
                <div className="w-80 h-80 max-w-xs flex flex-col justify-around items-center rounded-3xl bg-white p-3 hover:bg-inchworm">
                    <div className="text-black text-sm font-bold">
                        Today 5:30 pm
                    </div>
                    <div>Team A X Team B</div>
                    <div
                        className="bg-appred-200 w-72 h-9 flex justify-center items-center text-white
           font-bold rounded-md hover:bg-appred-250 hover:cursor-pointer"
                    >
                        Bet Now
                    </div>
                    <div>100 bets</div>
                </div>
            </div>
        </div>
    );
}
