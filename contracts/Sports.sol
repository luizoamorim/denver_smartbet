// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.17;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface USDC {
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract Sports is ChainlinkClient, Ownable, AccessControl{
    using Chainlink for Chainlink.Request;
    using Strings for uint256;

    // Game Variables
    mapping(uint256 => mapping(uint256 => Bet)) public betsByGame;
    mapping(uint256 => mapping(uint256 => Bet)) public loosersByGame;
    mapping(uint256 => Game) public games;

    uint256 public gameCount;

    // Admin Variables
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MOD_ROLE = keccak256("MOD_ROLE");
    bytes32 public constant RELAYER = keccak256("RELAYER");
    string public numbersAPI; //private, made public for testing
    string public gamesAPI; //private, made public for testing


    // Chainlink Variables
    bytes32 private jobIdNumbers;
    bytes32 private jobIdStrings;
    uint256 private fee;
    uint256 public lastNumber; //private, made public for testing
    uint256 public lastGame; //private, made public for testing
    string public lastTeamA; //private, made public for testing
    string public lastTeamB; //private, made public for testing
    string public lastDate; //private, made public for testing

    // USDC Variables
    USDC public USDc;

    modifier isMod {
        require(hasRole(MOD_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender) || msg.sender == owner(), "IS_NOT_MOD_OR_ADMIN");
        _;
    }

    modifier isAdmin {
        require(hasRole(ADMIN_ROLE, msg.sender) || msg.sender == owner(), "IS_NOT_ADMIN");
        _;
    }

    modifier isRelayer {
        require(hasRole(RELAYER, msg.sender) || msg.sender == owner(), "IS_NOT_RELAYER");
        _;
    }

    event Print(uint256 print);

    // Game Events and Structs
    event BetCreated(
        uint256 indexed _gameId,
        uint256 _homeScore,
        uint256 _awayScore
    );

    event GameCreated(
        string _gameTime,
        string indexed _homeTeam,
        string indexed _awayTeam
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
        string gameTime;
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

    event RequestMultipleFulfilled(
        bytes32 indexed requestId,
        string TeamA,
        string TeamB,
        string Date
    );

    struct RequestStatus {
        uint256 paid; // amount paid in link
        bool fulfilled; // whether the request has been successfully fulfilled
    }

    constructor(
        address _chainlinkToken,
        address _chainlinkOracle,
        bytes32 _jobIdNumbers,
        bytes32 _jobIdStrings,
        address _relayer,
        address _usdcContractAddress,
        address[] memory _mods,
        address[] memory _admins,
        string memory _numbersAPI, 
        string memory _gamesAPI
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
        jobIdNumbers = _jobIdNumbers; // por algum motivo n funciona sem jobIdNumbers hardcoded
        jobIdStrings = _jobIdStrings; // por algum motivo n funciona sem _jobIdStrings hardcoded
        fee = (1 * LINK_DIVISIBILITY) / 10; // 0,1 * 10**18 (Varies by network and job)

        // USDC Construct
        USDc = USDC(_usdcContractAddress);
    }


    function addGame(string memory _homeTeam, string memory _awayTeam, string memory _gameTime) public isMod{ // it's internal, made public for testing
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
        // Bet[] memory loosers = new Bet[](game.betsCount - winnersSize);
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
                loosersByGame[_gameId][loosersCount] = (bet);
                loosersCount++;
            }
            bet.betCompleted = true;
        }

        if(winnersCount == 0) {
            game.lotteryPool += game.betsAmount;
        }

        
        for (uint i = 0; i < winnersCount; i++) {
            // payable(winners[i].user).transfer(game.betsAmount * winners[i].amount / winnersBet);
            USDc.transfer(winners[i].user, game.betsAmount * winners[i].amount / winnersBet);
        }

        lastGame = _gameId;
        selectLotteryWinner(loosersCount);
        

    }

    function selectLotteryWinner(uint256 loosersQt) public { //internal, made public for testing
        Chainlink.Request memory req = buildChainlinkRequest(
            jobIdNumbers,
            address(this),
            this.fulfillNumber.selector
        );

        string memory url = string(abi.encodePacked(numbersAPI, loosersQt.toString()));
        req.add("get", url);
        
        req.add("path", "");

        req.addInt("times", 1);

        bytes32 request = sendChainlinkRequest(req, fee);

        uint256 winnerIndex = lastNumber;

        emit RequestFulfilled(request, winnerIndex);
    }


    function fulfillNumber(
        bytes32 _requestId,
        uint256 _number
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestNumber(_requestId, _number);
        lastNumber = _number;

        if (_number != uint256(-1 ** 256)) {
            // payable(loosers[lotteryWinnerIndex].user).transfer(game.lotteryPool);
            USDc.transfer(loosersByGame[lastGame][_number-1].user, games[lastGame].lotteryPool);
        }
    }

    function addGamesFromAPI() public {
    // Build the Chainlink request
        Chainlink.Request memory req = buildChainlinkRequest(
            jobIdStrings,
            address(this),
            this.fulfillGames.selector
        );

        // Set the API endpoint
        req.add("get", gamesAPI);

        // Set the path to the array of games

        string memory TeamA = string(abi.encodePacked(gameCount.toString(), ",teamA"));
        string memory TeamB = string(abi.encodePacked(gameCount.toString(), ",teamB"));
        string memory Date = string(abi.encodePacked(gameCount.toString(), ",date"));

        req.add("pathTEAMA", TeamA);
        req.add("pathTEAMB", TeamB);
        req.add("pathDATE", Date);

        // Send the Chainlink request
        sendChainlinkRequest(req, fee);

        // Store the requestId for later use in the fulfillGames callback
        // gameRequests[requestId] = true;
}

    function fulfillGames(bytes32 _requestId, string memory _teamA, string memory _teamB, string memory _date) public recordChainlinkFulfillment(_requestId) {
        emit RequestMultipleFulfilled(_requestId, _teamA, _teamB, _date);
        addGame(_teamA, _teamB, _date);
    }


    function makeBet(uint256 _gameId, uint256 _homeScore, uint256 _awayScore, uint256 _USDCamount) public {
        require(_gameId < gameCount, "Invalid game ID");
        require(_USDCamount > 0, "Bet amount must be greater than zero");

        bool transactionSuccess = USDc.transferFrom(msg.sender, address(this), _USDCamount);
        require(transactionSuccess, "Transaction failed");
        Game storage game = games[_gameId];
        require(!game.gameCompleted, "Game has already completed");

        uint256 ownerFee = _USDCamount / 20;
        uint256 lotteryAmount = _USDCamount / 5;        
        game.lotteryPool += lotteryAmount;
        game.betsAmount += _USDCamount - ownerFee - lotteryAmount;
        
        betsByGame[_gameId][game.betsCount] = Bet(msg.sender, _gameId, _USDCamount - ownerFee - lotteryAmount, _homeScore, _awayScore, false, false);
        game.betsCount++;

        
        emit BetCreated(_gameId, _homeScore, _awayScore);
    }

    // Admin Functions

    function updateNumberAPI(string memory _newUrl) public isAdmin {
        numbersAPI = _newUrl;
    }

    function updateChainlinkJobIdNumbers(bytes32 _newJobIdNumbers) public isAdmin {
        jobIdNumbers = _newJobIdNumbers;
    }

    function updateRelayer(address _newRelayer) public isAdmin {
        _grantRole(RELAYER, _newRelayer);
    }

    function transferFunds(uint256 _amount, address payable destination) public onlyOwner {
        USDc.transfer(destination, _amount);
    }

}