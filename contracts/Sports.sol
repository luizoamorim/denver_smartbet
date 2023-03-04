// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.17;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "./dev/functions/FunctionsClient.sol";

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
    // using Functions for Functions.Request;

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
    bytes32 private jobIdBytes;
    bytes32 private jobIdMultipleNumbers;
    uint256 private fee;
    uint256 public lastNumber; //private, made public for testing
    uint256 public lastGame; //private, made public for testing
    bytes32 public lastTeamA; //private, made public for testing
    bytes32 public lastTeamB; //private, made public for testing
    bytes32 public lastDate; //private, made public for testing

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
        bytes _gameTime,
        bytes indexed _homeTeam,
        bytes indexed _awayTeam
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
        bytes homeTeam;
        bytes homeTeamImage;
        bytes awayTeam;
        bytes awayTeamImage;
        bytes gameTime;
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
    event RequestBytesFulfilled(
        bytes32 indexed requestId,
        uint256 random
    );
    event RequestBytesFulfilled(bytes32 indexed requestId, bytes[] indexed data);


    event RequestGames(
        bytes32 indexed requestId,
        bytes TeamA,
        bytes TeamB,
        bytes Date
    );

    event RequesResult(
        bytes32 indexed requestId,
        uint256 TeamA,
        uint256 TeamB
    );

    struct RequestStatus {
        uint256 paid; // amount paid in link
        bool fulfilled; // whether the request has been successfully fulfilled
    }

    constructor(
        address _chainlinkToken,
        address _chainlinkOracle,
        bytes32 _jobIdNumbers,
        bytes32 _jobIdMultipleNumbers,
        bytes32 _jobIdBytes,
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
        jobIdNumbers = _jobIdNumbers; 
        jobIdBytes = _jobIdBytes;
        jobIdMultipleNumbers = _jobIdMultipleNumbers;
        fee = (1 * LINK_DIVISIBILITY) / 10; // 0,1 * 10**18 (Varies by network and job)

        // USDC Construct
        USDc = USDC(_usdcContractAddress);
    }

    function addGame(bytes memory _homeTeam, bytes memory _homeTeamImage, bytes memory _awayTeam, bytes memory _awayTeamImage, bytes memory _gameTime) public isMod{ // it's internal, made public for testing
        games[gameCount] = Game(_homeTeam, _homeTeamImage, _awayTeamImage, _awayTeam, _gameTime, 0, 0, false, 0, 0, 0);
        gameCount++;
        emit GameCreated(_gameTime, _homeTeam, _awayTeam);
    }

    function updateGameScore(uint256 _gameId, uint256 _homeScore, uint256 _awayScore) public isMod{ // it's internal, made public for testing
        require(_gameId < gameCount, "Invalid game ID");
        games[_gameId].homeScore = _homeScore;
        games[_gameId].awayScore = _awayScore;
        games[_gameId].gameCompleted = true;

        if(games[_gameId].betsCount == 0) {
            return;
        }

        uint256 winnersSize = 0;

        for (uint i = 0; i < games[_gameId].betsCount; i++) {
            Bet storage bet = betsByGame[_gameId][i];
            if (bet.homeScore == _homeScore && bet.awayScore == _awayScore) {
                winnersSize++;
            }
        }

        Bet[] memory winners = new Bet[](winnersSize);
        // Bet[] memory loosers = new Bet[](games[_gameId].betsCount - winnersSize);
        uint256 winnersCount = 0;
        uint256 loosersCount = 0;
        uint256 winnersBet = 0;

        for (uint i = 0; i < games[_gameId].betsCount; i++) {
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
            games[_gameId].lotteryPool += games[_gameId].betsAmount;
        }

        
        for (uint i = 0; i < winnersCount; i++) {
            // payable(winners[i].user).transfer(games[_gameId].betsAmount * winners[i].amount / winnersBet);
            USDc.transfer(winners[i].user, games[_gameId].betsAmount * winners[i].amount / winnersBet);
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

        emit RequestBytesFulfilled(request, winnerIndex);
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
        Chainlink.Request memory req = buildChainlinkRequest(
            jobIdBytes,
            address(this),
            this.fulfillBytesArray.selector
        );
        req.add("get", gamesAPI);
        req.add("path", gameCount.toString());
        sendOperatorRequest(req, fee);
    }

    function fulfillBytesArray(
        bytes32 requestId,
        bytes[] memory _arrayOfBytes
    ) public recordChainlinkFulfillment(requestId) {
        emit RequestBytesFulfilled(requestId, _arrayOfBytes);
        addGame(_arrayOfBytes[0], _arrayOfBytes[1], _arrayOfBytes[2], _arrayOfBytes[3], _arrayOfBytes[4]);
    }


    function makeBet(uint256 _gameId, uint256 _homeScore, uint256 _awayScore, uint256 _USDCamount) public {
        require(_gameId < gameCount, "Invalid game ID");
        require(_USDCamount > 0, "Bet amount must be greater than zero");

        bool transactionSuccess = USDc.transferFrom(msg.sender, address(this), _USDCamount);
        require(transactionSuccess, "Transaction failed");
        require(!games[_gameId].gameCompleted, "Game has already completed");

        uint256 ownerFee = _USDCamount / 20;
        uint256 lotteryAmount = _USDCamount / 5;        
        games[_gameId].lotteryPool += lotteryAmount;
        games[_gameId].betsAmount += _USDCamount - ownerFee - lotteryAmount;
        
        betsByGame[_gameId][games[_gameId].betsCount] = Bet(msg.sender, _gameId, _USDCamount - ownerFee - lotteryAmount, _homeScore, _awayScore, false, false);
        games[_gameId].betsCount++;

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