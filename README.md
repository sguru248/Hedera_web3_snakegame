# Snake Game - Hedera Testnet

A classic Snake game where player scores are registered on-chain using the Hedera Testnet. Built with Solidity, Hardhat, and vanilla JavaScript.

## Live Contract

**Deployed Contract:** `0x5bB7Dc3CfcC4c4D9E9712EfC697BB5171777fB19`

**Explorer:** [View on HashScan](https://hashscan.io/testnet/contract/0x5bB7Dc3CfcC4c4D9E9712EfC697BB5171777fB19)

## Features

- Classic snake game with increasing speed as you score higher
- On-chain score registration via Hedera smart contract
- MetaMask wallet integration (auto-adds Hedera Testnet)
- On-chain leaderboard showing top 10 scores
- Player best score tracking

## Tech Stack

- **Smart Contract:** Solidity 0.8.19
- **Deployment:** Hardhat + Hashio (Hedera JSON-RPC Relay)
- **Frontend:** HTML, CSS, JavaScript
- **Blockchain:** Hedera Testnet (Chain ID: 296)
- **Wallet:** MetaMask

## Project Structure

```
├── contracts/
│   └── SnakeScore.sol        # Smart contract for score storage
├── scripts/
│   └── deploy.js             # Hardhat deployment script
├── frontend/
│   ├── index.html            # Game UI
│   ├── style.css             # Styling
│   └── app.js                # Game logic + wallet + contract interaction
├── hardhat.config.js         # Hedera Testnet network config
├── .env.example              # Environment variables template
└── package.json
```

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [MetaMask](https://metamask.io/) browser extension

### Installation

```bash
git clone https://github.com/sguru248/Hedera_web3_snakegame.git
cd Hedera_web3_snakegame
npm install
```

### Get Testnet HBAR

1. Go to [Hedera Testnet Faucet](https://portal.hedera.com/faucet)
2. Paste your MetaMask wallet address
3. Receive 100 free testnet HBAR

### Deploy Contract (Optional)

If you want to deploy your own instance:

```bash
cp .env.example .env
# Edit .env and add your MetaMask private key
npm run compile
npm run deploy
# Update CONTRACT_ADDRESS in frontend/app.js with the new address
```

### Run the Game

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## How to Play

1. Click **Connect MetaMask** (it will auto-add Hedera Testnet)
2. Click **Start Game**
3. Use **Arrow Keys** or **WASD** to control the snake
4. Eat food to grow and score points
5. Speed increases with every food eaten
6. When game ends, click **Register Score On-Chain** to save your score

## Smart Contract

The `SnakeScore` contract provides:

| Function | Description |
|----------|-------------|
| `registerScore(uint256)` | Register a game score on-chain |
| `getTopScores(uint256)` | Get top N scores from leaderboard |
| `playerBestScore(address)` | Get a player's best score |
| `getTotalScores()` | Get total number of registered scores |

## License

MIT
