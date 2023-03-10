import magic from "@/utils/magic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Web3 from "web3";
interface GameCardProps {
    gameId: number;
    date: string;
    teamA: string;
    teamAImage: string;
    teamB: string;
    teamBImage: string;
    betQt: string;
    gameCompleted: boolean;
    lotteryPool: number;
    betsAmount: number;
}
import moment from "moment-timezone";
export default function GameCard(game: GameCardProps) {
    const [web3, setWeb3] = useState<Web3>();
    const myTimezone = "America/New_York";
    const myFormat = "MMM D, YYYY h:mm A z";

    useEffect(() => {
        setWeb3(new Web3(magic.rpcProvider as any));
    }, []);
    return (
        <div>
            {web3 && (
                <div className="w-96 h-80 flex flex-col justify-around items-center rounded-3xl bg-white">
                    <div className="text-black text-sm font-bold">
                        {moment(web3.utils.hexToAscii(game.date))
                            .tz(myTimezone)
                            .format(myFormat)}
                    </div>

                    <div className="flex items-center w-full justify-around px-4">
                        <div className="flex items-center">
                            <Image
                                src={web3.utils.hexToAscii(game.teamAImage)}
                                alt="an team immage"
                                width={56}
                                height={56}
                                className="rounded-xl mr-2"
                            />
                            <div className="w-10">
                                {web3.utils.hexToAscii(game.teamA)}
                            </div>
                        </div>
                        <p className="text-2xl font-bold ml-4">X</p>
                        <div className="flex items-center">
                            <Image
                                src={web3.utils.hexToAscii(game.teamBImage)}
                                alt="an team immage"
                                width={56}
                                height={56}
                                className="rounded-xl mr-2"
                            />
                            <div className="w-10">
                                {web3.utils.hexToAscii(game.teamB)}
                            </div>
                        </div>
                    </div>

                    <Link
                        className="bg-appred-200 w-72 h-9 flex justify-center items-center text-white
                font-bold rounded-md hover:bg-appred-250 hover:cursor-pointer"
                        href={{
                            pathname: "/makeBet",
                            query: { obj: JSON.stringify({ game }) },
                        }}
                    >
                        Bet Now
                    </Link>
                    <div className="border-t-2 w-full bg-slate-200"></div>
                    {game.betQt === "0" && (
                        <div className="pb-4 text-xl font-bold">
                            No bets yet
                        </div>
                    )}
                    {game.betQt !== "0" && (
                        <div className="flex flex-col pb-4 justify-center items-center">
                            <div className="text-xl font-bold">
                                +{game.betQt}
                            </div>
                            <div className="text-xl font-light">BETS</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
