import Link from "next/link";
interface GameCardProps {
    gameId: number;
    date: string;
    teamA: string;
    teamB: string;
    betQt: string;
}
export default function GameCard(game: GameCardProps) {
    return (
        <div>
            <div className="w-80 h-80 max-w-xs flex flex-col justify-around items-center rounded-3xl bg-white p-3 hover:bg-inchworm">
                <div className="text-black text-sm font-bold">{game.date}</div>
                <div>
                    {game.teamA} X {game.teamB}
                </div>
                <div
                    className="bg-appred-200 w-72 h-9 flex justify-center items-center text-white
           font-bold rounded-md hover:bg-appred-250 hover:cursor-pointer"
                >
                    Bet Now
                </div>
                <Link
                    href={{
                        pathname: "/makeBet",
                        query: { obj: JSON.stringify({ game }) },
                    }}
                >
                    Bet
                </Link>
                <div>{game.betQt}</div>
            </div>
        </div>
    );
}
