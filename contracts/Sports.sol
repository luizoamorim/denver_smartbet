// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.17;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Sports is ChainlinkClient, Ownable, AccessControl{
    using Chainlink for Chainlink.Request;
    using Strings for uint256;

    // Game Variables
    mapping(uint256 => mapping(uint256 => Bet)) public betsByGame;
    mapping(uint256 => Game) public games;

    uint256 public gameCount;

    // Admin Variables
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MOD_ROLE = keccak256("MOD_ROLE");
    bytes32 public constant RELAYER = keccak256("RELAYER");
    string private numbersAPI;
    string private gamesAPI;


    // Chainlink Variables
    bytes32 private jobId;
    uint256 private fee;
    uint256 public lastNumber; //private, made public for testing

    modifier isMod {
        require(hasRole(MOD_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender) || msg.sender = owner, "IS_NOT_MOD_OR_ADMIN");
        _;
    }

    modifier isAdmin {
        require(hasRole(ADMIN_ROLE, msg.sender) || msg.sender == owner, "IS_NOT_ADMIN");
        _;
    }

    modifier isRelayer {
        require(hasRole(RELAYER, msg.sender), "IS_NOT_RELAYER");
        _;
    }

    event Print(uint256 print);

    // Game Events and Structs
    event BetCreated(
        uint256 indexed _gameId,
        uint256 _homeScore,
        uint256 _awayScore
    );

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

    // Chainlink Events and Structs
    event RequestNumber(bytes32 indexed requestId, uint256 number);
    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(
        bytes32 requestId,
        uint256 random
    );

    struct RequestStatus {
        uint256 paid; // amount paid in link
        bool fulfilled; // whether the request has been successfully fulfilled
    }

    constructor(
        address _chainlinkToken,
        address _chainlinkOracle,
        bytes32 _jobId,
        address _relayer,
        address[] memory _mods,
        address[] memory _admins,
        string memory _numbersAPI
        ) {

        // Admin Construct
        for (uint256 i = 0; i < _mods.length; ++i) {
            _grantRole(MOD_ROLE, _mods[i]);
        }

        for (uint256 i = 0; i < _admins.length; ++i) {
            _grantRole(ADMIN_ROLE, _admins[i]);
        }

        _grantRole(RELAYER, _relayer);

        numbersAPI = _numbersAPI;
        gamesAPI = _gamesAPI;
        // Chainlink construct
        setChainlinkToken(_chainlinkToken);
        setChainlinkOracle(_chainlinkOracle);
        jobId = _jobId; // por algum motivo n funciona sem jobId hardcoded
        fee = (1 * LINK_DIVISIBILITY) / 10; // 0,1 * 10**18 (Varies by network and job)
    }

    event GameCreated(
        uint256 _gameTime,
        string indexed _homeTeam,
        string indexed _awayTeam
    );

    function updateDashboard() public isRelayer{
        // Chainlink.Request memory req = buildChainlinkRequest(
        //     jobId,
        //     address(this),
        //     this.apiCall.selector
        // );

        // req.add(
        //     "get",
        //     gamesAPI
        // );
        
        // req.add("path", "");

        // bytes32 request = sendChainlinkRequest(req, fee);

        // uint256 winnerIndex = lastNumber;

        // emit RequestFulfilled(request, winnerIndex);
        
        // return winnerIndex;
    }

    function addGame(string memory _homeTeam, string memory _awayTeam, uint256 _gameTime) public isMod{ // it's internal, made public for testing
        games[gameCount] = Game(_homeTeam, _awayTeam, _gameTime, 0, 0, false, 0, 0, 0);
        gameCount++;
        emit GameCreated(_gameTime, _homeTeam, _awayTeam);
    }

    function updateGameScore(uint256 _gameId, uint256 _homeScore, uint256 _awayScore) public isMod{ // it's internal, made public for testing
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

        Bet[] memory winners = new Bet[](winnersSize);
        Bet[] memory loosers = new Bet[](game.betsCount - winnersSize);
        uint256 winnersCount = 0;
        uint256 loosersCount = 0;
        uint256 winnersBet = 0;

        for (uint i = 0; i < game.betsCount; i++) {
            Bet storage bet = betsByGame[_gameId][i];
            if (bet.homeScore == _homeScore && bet.awayScore == _awayScore) {
                bet.betWon = true;
                
                winners[winnersCount] = (bet);
                winnersBet += bet.amount;
                winnersCount++;
            } else {
                loosers[loosersCount] = (bet);
                loosersCount++;
            }
            bet.betCompleted = true;
        }

        if(winnersCount == 0) {
            game.lotteryPool += game.betsAmount;
        }

        
        for (uint i = 0; i < winnersCount; i++) {
            payable(winners[i].user).transfer(game.betsAmount * winners[i].amount / winnersBet);
        }

        uint256 lotteryWinnerIndex = selectLotteryWinner(loosersCount);
        if (lotteryWinnerIndex != uint256(-1 ** 256)) {
            payable(loosers[lotteryWinnerIndex].user).transfer(game.lotteryPool);
        }

    }

    function selectLotteryWinner(uint256 loosersQt) public returns (uint256) { //internal, made public for testing
        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );

        string memory url = string(abi.encodePacked(numbersAPI, loosersQt.toString()));
        req.add(
            "get",
            url
        );
        
        req.add("path", "");

        bytes32 request = sendChainlinkRequest(req, fee);

        uint256 winnerIndex = lastNumber;

        emit RequestFulfilled(request, winnerIndex);
        
        return winnerIndex;
    }


    function fulfill(
        bytes32 _requestId,
        uint256 _number
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestNumber(_requestId, _number);
        lastNumber = _number;
    }

    function apiCall(
        bytes32 _requestId,
        uint256 _number
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestNumber(_requestId, _number);
        lastNumber = _number;
    }

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

        
        emit BetCreated(_gameId, _homeScore, _awayScore);
    }

    // Admin Functions

    function updateNumberAPI(string memory _newUrl) public isAdmin {
        numbersAPI = _newUrl;
    }

    function updateChainlinkJobId(bytes32 _newJobId) public isAdmin {
        jobId = _newJobId;
    }

    function updateRelayer(address _newRelayer) public isAdmin {
        _grantRole(RELAYER, _newRelayer);
    }

    function transferFunds(uint256 _amount, address payable destination) public onlyOwner {
        destination.transfer(_amount);
    }


    // function addMod(address _newMod) public onlyOwner {
    //     _grantRole(MOD_ROLE, _newMod);
    // }

    // function removeAdmin(address _kickAdmin) public onlyOwner {
    //     _revokeRole(ADMIN_ROLE, _kickAdmin);
    // }

    // function removeMod(address _kickMod) public onlyOwner {
    //     _revokeRole(MOD_ROLE, _kickMod);
    // }


}