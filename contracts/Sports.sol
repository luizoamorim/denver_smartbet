// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

contract Sports {

    event Print(uint256 print);
    struct Bet {
        address user;
        uint256 gameId;
        uint256 amount;
        uint256 homeScore;
        uint256 awayScore;
        bool betWon;
        bool betCompleted;
    }

    struct Game {
        string homeTeam;
        string awayTeam;
        uint256 gameTime;
        uint256 homeScore;
        uint256 awayScore;
        bool gameCompleted;        
        uint256 lotteryPool;
        uint256 betsCount;
        uint256 betsAmount;
    }
        
    mapping(uint256 => mapping(uint256 => Bet)) public betsByGame;

    mapping(uint256 => Game) public games;

    uint256 public gameCount;

    address payable public contractOwner;

    constructor() {
        contractOwner = payable(msg.sender);
    }

    event GameCreated(
        uint256 _gameTime,
        string indexed _homeTeam,
        string indexed _awayTeam
    );

    function addGame(string memory _homeTeam, string memory _awayTeam, uint256 _gameTime) public {
        games[gameCount] = Game(_homeTeam, _awayTeam, _gameTime, 0, 0, false, 0, 0, 0);
        gameCount++;
        emit GameCreated(_gameTime, _homeTeam, _awayTeam);
    }

    function updateGameScore(uint256 _gameId, uint256 _homeScore, uint256 _awayScore) public {
        require(_gameId < gameCount, "Invalid game ID");
        Game storage game = games[_gameId];
        game.homeScore = _homeScore;
        game.awayScore = _awayScore;
        game.gameCompleted = true;

        if(game.betsCount == 0) {
            return;
        }

        uint256 winnersSize = 0;

        for (uint i = 0; i < game.betsCount; i++) {
            Bet storage bet = betsByGame[_gameId][i];
            if (bet.homeScore == _homeScore && bet.awayScore == _awayScore) {
                winnersSize++;
            }
        }

        address[] memory winners = new address[](winnersSize);
        address[] memory loosers = new address[](game.betsCount - winnersSize);
        uint256 winnersCount = 0;
        uint256 loosersCount = 0;

        for (uint i = 0; i < game.betsCount; i++) {
            Bet storage bet = betsByGame[_gameId][i];
            if (bet.homeScore == _homeScore && bet.awayScore == _awayScore) {
                bet.betWon = true;
                
                winners[winnersCount] = (bet.user);
                winnersCount++;
            } else {
                loosers[loosersCount] = (bet.user);
                loosersCount++;
            }
            bet.betCompleted = true;
        }

        if(winners.length == 0) {
            game.lotteryPool += game.betsAmount;
        }

        
        for (uint i = 0; i < winnersCount; i++) {
            payable(winners[i]).transfer(game.betsAmount / winnersCount);
        }

        uint256 lotteryWinnerIndex = selectLotteryWinner(_gameId, loosersCount);
        if (lotteryWinnerIndex != uint256(-1 ** 256)) {
            payable(loosers[1]).transfer(game.lotteryPool);
        }


    }

    function selectLotteryWinner(uint256 _gameId, uint256 loosersQt) internal view returns (uint256) {
        // Game storage game = games[_gameId];
        // uint256 betCount = game.betsCount;

        uint256 winnerIndex = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, _gameId))) % loosersQt;
        
        return winnerIndex;
    }

    event BetCreated(
        uint256 indexed _gameId,
        uint256 _homeScore,
        uint256 _awayScore
    );

    function makeBet(uint256 _gameId, uint256 _homeScore, uint256 _awayScore) payable public {
        require(_gameId < gameCount, "Invalid game ID");
        require(msg.value > 0, "Bet amount must be greater than zero");
        Game storage game = games[_gameId];
        require(!game.gameCompleted, "Game has already completed");

        uint256 ownerFee = msg.value / 20;
        uint256 lotteryAmount = msg.value / 5;        
        game.lotteryPool += lotteryAmount;
        game.betsAmount += msg.value - ownerFee - lotteryAmount;
        
        betsByGame[_gameId][game.betsCount] = Bet(msg.sender, _gameId, msg.value - ownerFee - lotteryAmount, _homeScore, _awayScore, false, false);
        game.betsCount++;

        contractOwner.transfer(ownerFee);
        emit BetCreated(_gameId, _homeScore, _awayScore);
    }
}