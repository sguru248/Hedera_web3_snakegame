// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SnakeScore {
    struct Score {
        address player;
        uint256 score;
        uint256 timestamp;
    }

    Score[] public topScores;
    mapping(address => uint256) public playerBestScore;

    event ScoreRegistered(address indexed player, uint256 score, uint256 timestamp);

    function registerScore(uint256 _score) external {
        if (_score > playerBestScore[msg.sender]) {
            playerBestScore[msg.sender] = _score;
        }

        topScores.push(Score({
            player: msg.sender,
            score: _score,
            timestamp: block.timestamp
        }));

        emit ScoreRegistered(msg.sender, _score, block.timestamp);
    }

    function getTopScores(uint256 _count) external view returns (Score[] memory) {
        uint256 len = topScores.length;
        if (_count > len) _count = len;

        // Copy all scores, then sort top N (simple selection sort for demo)
        Score[] memory sorted = new Score[](len);
        for (uint256 i = 0; i < len; i++) {
            sorted[i] = topScores[i];
        }

        for (uint256 i = 0; i < _count; i++) {
            for (uint256 j = i + 1; j < len; j++) {
                if (sorted[j].score > sorted[i].score) {
                    Score memory temp = sorted[i];
                    sorted[i] = sorted[j];
                    sorted[j] = temp;
                }
            }
        }

        Score[] memory result = new Score[](_count);
        for (uint256 i = 0; i < _count; i++) {
            result[i] = sorted[i];
        }
        return result;
    }

    function getTotalScores() external view returns (uint256) {
        return topScores.length;
    }
}
