// ============================================
// CONFIG - Update after deploying the contract
// ============================================
const CONTRACT_ADDRESS = "0x5bB7Dc3CfcC4c4D9E9712EfC697BB5171777fB19";
const HEDERA_TESTNET_CHAIN_ID = "0x128"; // 296 in hex

const CONTRACT_ABI = [
    "function registerScore(uint256 _score) external",
    "function getTopScores(uint256 _count) external view returns (tuple(address player, uint256 score, uint256 timestamp)[])",
    "function playerBestScore(address) external view returns (uint256)",
    "function getTotalScores() external view returns (uint256)",
    "event ScoreRegistered(address indexed player, uint256 score, uint256 timestamp)"
];

// ============================================
// WALLET
// ============================================
let provider, signer, contract;

async function connectWallet() {
    if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
    }

    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

        // Switch to Hedera Testnet
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: HEDERA_TESTNET_CHAIN_ID }],
            });
        } catch (switchErr) {
            // Chain not added yet - add it
            if (switchErr.code === 4902) {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: HEDERA_TESTNET_CHAIN_ID,
                        chainName: "Hedera Testnet",
                        nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
                        rpcUrls: ["https://testnet.hashio.io/api"],
                        blockExplorerUrls: ["https://hashscan.io/testnet/"]
                    }],
                });
            } else {
                throw switchErr;
            }
        }

        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        const addr = accounts[0];
        const short = addr.slice(0, 6) + "..." + addr.slice(-4);
        document.getElementById("walletAddr").textContent = short;
        document.getElementById("connectBtn").textContent = "Connected";
        document.getElementById("connectBtn").classList.add("connected");

        // Load best score & leaderboard
        try {
            const best = await contract.playerBestScore(addr);
            document.getElementById("bestScore").textContent = best.toString();
        } catch (_) {}
        loadLeaderboard();
    } catch (err) {
        console.error(err);
        alert("Connection failed: " + err.message);
    }
}

// ============================================
// SNAKE GAME
// ============================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const GRID = 20;
const TILE = canvas.width / GRID;

let snake, direction, nextDirection, food, score, gameLoop, running, speed;

const START_SPEED = 200;   // slow start (ms per tick)
const MIN_SPEED = 60;      // fastest speed cap
const SPEED_STEP = 10;     // ms faster per food eaten

function startGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = START_SPEED;
    running = true;
    document.getElementById("currentScore").textContent = "0";
    placeFood();
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(tick, speed);
}

function placeFood() {
    while (true) {
        food = {
            x: Math.floor(Math.random() * GRID),
            y: Math.floor(Math.random() * GRID)
        };
        // Make sure food doesn't spawn on snake
        if (!snake.some(s => s.x === food.x && s.y === food.y)) break;
    }
}

function tick() {
    direction = nextDirection;
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // Wall collision
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
        return gameOver();
    }

    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
        return gameOver();
    }

    snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById("currentScore").textContent = score;
        placeFood();

        // Increase speed
        speed = Math.max(MIN_SPEED, speed - SPEED_STEP);
        clearInterval(gameLoop);
        gameLoop = setInterval(tick, speed);
    } else {
        snake.pop();
    }

    draw();
}

function draw() {
    // Background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines (subtle)
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * TILE, 0);
        ctx.lineTo(i * TILE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * TILE);
        ctx.lineTo(canvas.width, i * TILE);
        ctx.stroke();
    }

    // Snake
    snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? "#4ade80" : "#22c55e";
        ctx.fillRect(seg.x * TILE + 1, seg.y * TILE + 1, TILE - 2, TILE - 2);
        ctx.strokeStyle = "#166534";
        ctx.lineWidth = 1;
        ctx.strokeRect(seg.x * TILE + 1, seg.y * TILE + 1, TILE - 2, TILE - 2);
    });

    // Food
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(food.x * TILE + TILE / 2, food.y * TILE + TILE / 2, TILE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
}

function gameOver() {
    running = false;
    clearInterval(gameLoop);
    document.getElementById("finalScore").textContent = score;
    document.getElementById("txStatus").textContent = "";
    document.getElementById("registerBtn").disabled = false;
    document.getElementById("gameOverModal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("gameOverModal").classList.add("hidden");
}

// ============================================
// ON-CHAIN SCORE REGISTRATION
// ============================================
async function registerScore() {
    if (!contract) {
        alert("Please connect your wallet first!");
        return;
    }
    if (score === 0) {
        alert("Score is 0, nothing to register.");
        return;
    }

    const btn = document.getElementById("registerBtn");
    const status = document.getElementById("txStatus");

    try {
        btn.disabled = true;
        status.textContent = "Sending transaction...";

        const tx = await contract.registerScore(score);
        status.textContent = "Waiting for confirmation...";

        await tx.wait();
        status.textContent = "Score registered on-chain!";

        // Update best score
        const addr = await signer.getAddress();
        const best = await contract.playerBestScore(addr);
        document.getElementById("bestScore").textContent = best.toString();

        loadLeaderboard();
    } catch (err) {
        console.error(err);
        status.textContent = "Failed: " + (err.reason || err.message);
        btn.disabled = false;
    }
}

async function loadLeaderboard() {
    if (!contract) return;

    const tbody = document.getElementById("leaderboardBody");
    try {
        const scores = await contract.getTopScores(10);

        if (scores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No scores yet. Be the first!</td></tr>';
            return;
        }

        tbody.innerHTML = scores.map((s, i) => {
            const addr = s.player.slice(0, 6) + "..." + s.player.slice(-4);
            const date = new Date(s.timestamp.toNumber() * 1000).toLocaleDateString();
            return `<tr>
                <td>${i + 1}</td>
                <td>${addr}</td>
                <td>${s.score.toString()}</td>
                <td>${date}</td>
            </tr>`;
        }).join("");
    } catch (err) {
        console.error("Leaderboard error:", err);
        tbody.innerHTML = '<tr><td colspan="4">Error loading scores</td></tr>';
    }
}

// ============================================
// KEYBOARD CONTROLS
// ============================================
document.addEventListener("keydown", (e) => {
    if (!running) return;
    switch (e.key) {
        case "ArrowUp": case "w": case "W":
            if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
            break;
        case "ArrowDown": case "s": case "S":
            if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
            break;
        case "ArrowLeft": case "a": case "A":
            if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
            break;
        case "ArrowRight": case "d": case "D":
            if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
            break;
    }
});

// Initial draw
(function () {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#333";
    ctx.font = "16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Press Start to play", canvas.width / 2, canvas.height / 2);
})();
