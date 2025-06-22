//ui.js
// js/ui.js
// Note: This module will need access to game state variables like winningScore, currentComputerDifficulty,
// playerScore, computerScore, gameState. These can be passed in, or main.js can update them
// and ui.js just reads them when needed. For simplicity here, we assume some shared state or callbacks.

let scoreElement, gameSetupScreen, winScoreSelect, customScoreInputContainer, customWinScoreInput;
let computerDifficultySelect, startGameButton, gameSettingsDisplay;
let gameOverScreen, gameOverMessage, playAgainButton;

// This object will be populated by main.js with shared state and control functions
export const uiBridge = {
    getWinningScore: () => 5,
    setWinningScore: (score) => {},
    getComputerDifficulty: () => 'MEDIUM',
    setComputerDifficulty: (difficulty) => {},
    getPlayerScore: () => 0,
    getComputerScore: () => 0,
    getGameState: () => 'SETUP',
    startGameCallback: () => {},
    playAgainCallback: () => {}
};

export function initUI() {
    scoreElement = document.getElementById('score');
    gameSetupScreen = document.getElementById('gameSetupScreen');
    winScoreSelect = document.getElementById('winScoreSelect');
    customScoreInputContainer = document.getElementById('customScoreInputContainer');
    customWinScoreInput = document.getElementById('customWinScore');
    computerDifficultySelect = document.getElementById('computerDifficultySelect');
    startGameButton = document.getElementById('startGameButton');
    gameSettingsDisplay = document.getElementById('gameSettingsDisplay');
    gameOverScreen = document.getElementById('gameOverScreen');
    gameOverMessage = document.getElementById('gameOverMessage');
    playAgainButton = document.getElementById('playAgainButton');

    winScoreSelect.addEventListener('change', updateSetupUIDisplay);
    customWinScoreInput.addEventListener('input', updateSetupUIDisplay); 
    computerDifficultySelect.addEventListener('change', updateSetupUIDisplay);
    
    startGameButton.addEventListener('click', () => {
        // Finalize settings from UI before calling start
        let score = parseInt(winScoreSelect.value);
        if (winScoreSelect.value === 'custom') {
            score = parseInt(customWinScoreInput.value);
        }
        if (isNaN(score) || score < 1 || score > 99) score = 5;
        uiBridge.setWinningScore(score);
        uiBridge.setComputerDifficulty(computerDifficultySelect.value);
        uiBridge.startGameCallback();
    });
    playAgainButton.addEventListener('click', () => {
        uiBridge.playAgainCallback();
    });

    // Initial UI update
    updateSetupUIDisplay();
}

export function updateScoreDisplay() {
    if(scoreElement) {
        scoreElement.textContent = `Player: ${uiBridge.getPlayerScore()} - Computer: ${uiBridge.getComputerScore()}`;
    }
}

export function updateSetupUIDisplay() { // Renamed to avoid conflict, focuses on display logic
    let currentWinningScore = parseInt(winScoreSelect.value);
    if (winScoreSelect.value === 'custom') {
        customScoreInputContainer.style.display = 'block';
        currentWinningScore = parseInt(customWinScoreInput.value) || 5;
    } else {
        customScoreInputContainer.style.display = 'none';
    }
    if (currentWinningScore < 1 || currentWinningScore > 99) currentWinningScore = 5;
    
    // Ensure inputs reflect the actual value
    if (winScoreSelect.value !== 'custom') winScoreSelect.value = currentWinningScore.toString();
    customWinScoreInput.value = currentWinningScore;


    const currentDifficulty = computerDifficultySelect.value;
    gameSettingsDisplay.innerHTML = `First to ${currentWinningScore} goals wins!<br>Computer Difficulty: ${currentDifficulty}`;
    
    // Update the actual game settings via the bridge if needed immediately on change,
    // or wait for startGameButton. For now, it's just display.
    // uiBridge.setWinningScore(currentWinningScore); // Potentially
    // uiBridge.setComputerDifficulty(currentDifficulty); // Potentially
}


export function showGameSetupScreen() {
    if (!gameSetupScreen) return;
    // Reset UI elements to reflect current game settings before showing
    winScoreSelect.value = uiBridge.getWinningScore().toString();
    if (winScoreSelect.options[winScoreSelect.selectedIndex].value !== uiBridge.getWinningScore().toString() &&
        (uiBridge.getWinningScore() !== 3 && uiBridge.getWinningScore() !== 5 && uiBridge.getWinningScore() !== 7 && uiBridge.getWinningScore() !== 10)) {
        // If winning score is custom and not a preset
        winScoreSelect.value = "custom";
    }
    customWinScoreInput.value = uiBridge.getWinningScore();
    computerDifficultySelect.value = uiBridge.getComputerDifficulty();
    updateSetupUIDisplay(); // Refresh the text display

    gameSetupScreen.classList.add('visible');
    if(gameOverScreen) gameOverScreen.classList.remove('visible');
}

export function hideGameSetupScreen() {
    if(gameSetupScreen) gameSetupScreen.classList.remove('visible');
}

export function showGameOverScreen(message) {
    if (!gameOverScreen) return;
    if(gameOverMessage) gameOverMessage.textContent = message;
    gameOverScreen.classList.add('visible');
    if(gameSetupScreen) gameSetupScreen.classList.remove('visible');
}

export function hideGameOverScreen() {
    if(gameOverScreen) gameOverScreen.classList.remove('visible');
}


