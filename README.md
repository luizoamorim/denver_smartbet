# Smart Bets
Smart Bets is a decentralized betting platform for NBA games that uses blockchain technology to create a safe and friendly interface. Our platform offers transparency and security for users' transactions. In this README file, we will cover the following topics:

- How to run the front end
- How to deploy the contracts on the Polygon testnet
- Why Polygon is a great technology choice for the project
- How to feed the contract with the LINK token
- How to use the Open Zeppelin Defender relayer for automatic calls and admin management
- Benefits of using Magic wallet in the project and blockchain compatibility.

## How to run the front end

To run the front end, follow these steps:

1. Clone the repository
2. Navigate to the project directory
3. Run `cd frontend`
4. Install the dependencies using `npm install`
5. Start the development server using `npm run dev`

The front end should now be running on `http://localhost:3000/`. 

## Deploying Smart Contracts on the Polygon Testnet

To deploy the Smart Bet smart contracts on the Polygon testnet, you will need to follow these steps:

1. Create a Polygon wallet.
2. Fund the wallet with testnet MATIC. You can obtain testnet MATIC by following the instructions at [Polygon's Faucet page](https://faucet.polygon.technology/).
3. Run `npx hardhat run --network mumbai ./scripts/deploy.ts`.

## Why Polygon is a great technology choice for the project

Polygon (previously known as Matic Network) is a layer 2 scaling solution for Ethereum that provides fast and cheap transactions. It achieves this by using a Proof-of-Stake (PoS) consensus mechanism, which allows for higher transaction throughput and lower fees compared to the Ethereum mainnet. Additionally, Polygon supports the Ethereum Virtual Machine (EVM), making it compatible with existing Ethereum tools and smart contracts. These benefits make Polygon an excellent choice for this project, as it allows for fast and affordable transactions on a secure network.

## How to feed the contract with the LINK token

To feed the contract with the LINK token, the user needs to transfer LINK tokens to the contract's address. The contract will then use the tokens to pay Chainlink nodes for retrieving data from external sources. 

## How to use the Open Zeppelin Defender relayer for automatic calls and admin management

The Open Zeppelin Defender relayer is used in this project for automatic function calls and admin management of the contract. To use the Defender relayer, follow these steps:

1. Create a Defender account
2. Create a relayer to use the autotasks to configure when the functions `addResultsFromAPI` and `addGamesFromAPI` are supposed o be called.
3. Use the Defender dashboard to configure automatic function calls and manage the contract's admin functions


## Benefits of using Magic wallet in the project and blockchain compatibility

Magic wallet is an SDK that provides a simple and secure way to integrate web3 wallets into your application. It uses modern cryptographic techniques to provide secure, passwordless authentication for users, and allows them to easily sign transactions. Magic wallet is compatible with a variety of blockchains, including Ethereum and Polygon, making it a great choice for this project.

One of the challenges of implementing Magic wallet in this project was to find out which blockchains it is compatible with. However, since Magic wallet is compatible with Ethereum, which is the base blockchain of Polygon, it was easy to integrate it into the project. 

## Conclusion

Smart Bet is a Decentralized Betting Platform for NBA games that utilizes blockchain technology to provide a secure and transparent betting experience for users. The platform aims to address the challenges of traditional betting platforms by ensuring security, transparency, and easy payment methods through blockchain technology. The project utilizes various technologies, such as Polygon for deployment, Circle for USDC token payments, Magic for user authentication, Chainlink for off-chain data access, and Open Zeppelin for smart contract management. Smart Bet is classified as a DeFi platform, and the business model is to distribute 70% of the bets' money to the winners, 20% to lottery, 5% to partners, and 5% to the platfor
