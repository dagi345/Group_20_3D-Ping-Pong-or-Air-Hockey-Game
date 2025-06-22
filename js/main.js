// js/main.js
import * as Config from './config.js';
import * as Gfx from './graphics.js';
import * as Phys from './physics.js';
import * as GameObjects from './gameObjects.js';
import * as UI from './ui.js';
import * as Player from './playerControls.js';
import * as Computer from './computerOpponent.js';

// --- Global Game State & Variables ---
let scene, camera, renderer;
let world, puckMaterial, paddleMaterial, wallMaterial;
let puck, playerPaddle, computerPaddle;
let puckBody, playerPaddleBody, computerPaddleBody;

let playerScore = 0;
let computerScore = 0;
let winningScore = 5; 
let currentComputerDifficulty = 'MEDIUM';
let gameState = 'SETUP';

// Current Computer parameters for the active game
let activeComputerParams = {};

let lastCallTime = performance.now();

// --- Initialization ---
function init() {
    // Graphics
    const gfxInit = Gfx.initThree();
    scene = gfxInit.scene;
    camera = gfxInit.camera;
    renderer = gfxInit.renderer;

    // Physics
    const physInit = Phys.initCannon();
    world = physInit.world;
    puckMaterial = physInit.puckMaterial;
    paddleMaterial = physInit.paddleMaterial;
    wallMaterial = physInit.wallMaterial;
    Phys.setupContactMaterials(world, puckMaterial, paddleMaterial, wallMaterial);

    // Game Objects
    GameObjects.createTable(scene, world, wallMaterial);
    const puckData = GameObjects.createPuck(scene, world, puckMaterial);
    puck = puckData.mesh;
    puckBody = puckData.body;

    const playerPaddleData = GameObjects.createPlayerPaddle(scene, world, paddleMaterial);
    playerPaddle = playerPaddleData.mesh;
    playerPaddleBody = playerPaddleData.body;

    const computerPaddleData = GameObjects.createComputerPaddle(scene, world, paddleMaterial);
    computerPaddle = computerPaddleData.mesh;
    computerPaddleBody = computerPaddleData.body;

    // Player Controls
    Player.initPlayerControls(camera, playerPaddleBody);
    Player.playerTargetPos.set(0, Config.FIXED_Y_OFFSET, Config.PLAYER_START_Z); // Initialize target

    // Computer Opponent References
    Computer.setComputerOpponentReferences(puckBody, computerPaddleBody);

    // UI Initialization and Bridge Setup
    UI.uiBridge.getWinningScore = () => winningScore;
    UI.uiBridge.setWinningScore = (score) => { winningScore = score; };
    UI.uiBridge.getComputerDifficulty = () => currentComputerDifficulty;
    UI.uiBridge.setComputerDifficulty = (difficulty) => { currentComputerDifficulty = difficulty; };
    UI.uiBridge.getPlayerScore = () => playerScore;
    UI.uiBridge.getComputerScore = () => computerScore;
    UI.uiBridge.getGameState = () => gameState;
    UI.uiBridge.startGameCallback = startGame;
    UI.uiBridge.playAgainCallback = transitionToSetup;
    UI.initUI();
    
    transitionToSetup(); 
    animate();
}

// --- Game State Management ---
function transitionToSetup() {
    gameState = 'SETUP';
    UI.showGameSetupScreen();
    UI.updateScoreDisplay(); // Reset score display visually too
    
    resetPaddlesAndPuck(); // Ensure puck and paddles are reset

    if (playerPaddleBody) playerPaddleBody.velocity.set(0,0,0);
    if (computerPaddleBody) computerPaddleBody.velocity.set(0,0,0);
    if (puckBody) puckBody.velocity.set(0,0,0);
}

function startGame() {
    // Winning score and difficulty are set by ui.js through the bridge
    // Or, if ui.js only updates display, read them here from DOM like before
    // For this example, ui.js uses the bridge
    // Set active computer parameters
    const selectedParams = Config.computerParamsByDifficulty[currentComputerDifficulty];
    activeComputerParams = {
        currentComputerSpeed: selectedParams.speed,
        currentComputerLookAheadTime: selectedParams.lookAheadTime,
        currentComputerKpXFactor: selectedParams.kpXFactor,
        currentComputerKpZFactor: selectedParams.kpZFactor,
        currentComputerReturnToCenterSpeedFactor: selectedParams.returnToCenterSpeedFactor,
        currentComputerEngageTargetZOffset: Config.PADDLE_RADIUS * selectedParams.engageTargetZOffsetFactor,
        currentComputerUnstickAggressionZFactor: selectedParams.unstickAggressionZFactor,
    };
    Computer.updateComputerParameters(activeComputerParams); // Inform computer module

    gameState = 'PLAYING';
    UI.hideGameSetupScreen();
    UI.hideGameOverScreen();
            
    playerScore = 0; 
    computerScore = 0;
    UI.updateScoreDisplay();
    resetPaddlesAndPuck(); 
    console.log(`Game started. Winning score: ${winningScore}, Computer Difficulty: ${currentComputerDifficulty}`);
}

function transitionToGameOver(message) {
    gameState = 'GAMEOVER';
    UI.showGameOverScreen(message);
    
    if (playerPaddleBody) playerPaddleBody.velocity.set(0,0,0);
    if (computerPaddleBody) computerPaddleBody.velocity.set(0,0,0);
    if (puckBody) puckBody.velocity.set(0,0,0);
}

function resetPaddlesAndPuck() {
    if (!puckBody || !playerPaddleBody || !computerPaddleBody) {
        console.error("Critical error: Attempting to reset objects before they are fully initialized.");
        return;
    }

    const bodiesToReset = [puckBody, playerPaddleBody, computerPaddleBody];
    bodiesToReset.forEach(body => {
        if (body) {
            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(0, 0, 0);
            body.force.set(0,0,0);
            body.torque.set(0,0,0);
        }
    });

    if (puckBody) {
        puckBody.userData = {}; 
        puckBody.position.set(0, Config.FIXED_Y_OFFSET, 0);
    }
    
    if (playerPaddleBody) {
        playerPaddleBody.position.set(0, Config.FIXED_Y_OFFSET, Config.PLAYER_START_Z);
    }
    Player.playerTargetPos.set(0, Config.FIXED_Y_OFFSET, Config.PLAYER_START_Z);


    if (computerPaddleBody) {
        computerPaddleBody.position.set(0, Config.FIXED_Y_OFFSET, Config.COMPUTER_START_Z);
    }

    bodiesToReset.forEach(body => {
        if (body) body.wakeUp();
    });
}

function checkGoal() {
    if (!puckBody || gameState !== 'PLAYING') return; 

    const puckX = puckBody.position.x; 
    const puckZ = puckBody.position.z;
    let goalScoredThisFrame = false; 

    if (puckZ > Config.TABLE_LENGTH / 2 + Config.PUCK_RADIUS * 0.65 && Math.abs(puckX) < Config.GOAL_WIDTH / 2) {
        if (!puckBody.userData.justScored) { 
            computerScore++;
            goalScoredThisFrame = true;
            puckBody.userData.justScored = true; 
        }
    } else if (puckZ < -Config.TABLE_LENGTH / 2 - Config.PUCK_RADIUS * 0.65 && Math.abs(puckX) < Config.GOAL_WIDTH / 2) {
         if (!puckBody.userData.justScored) {
            playerScore++;
            goalScoredThisFrame = true;
            puckBody.userData.justScored = true;
        }
    }

    if (goalScoredThisFrame) {
        UI.updateScoreDisplay();
        if (playerScore >= winningScore) {
            transitionToGameOver("Player Wins!");
        } else if (computerScore >= winningScore) {
            transitionToGameOver("Computer Wins!");
        } else {
            resetPaddlesAndPuck();
        }
    }
}

// --- Game Loop ---
function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    let dt = (now - lastCallTime) / 1000;
    if (dt > 0.05) dt = 0.05; // Cap delta time
    if (dt <= 1e-5) { // Skip if delta time is too small
        lastCallTime = now;
        if(renderer && scene && camera) renderer.render(scene, camera);
        return;
    }
    lastCallTime = now;


    if (gameState === 'PLAYING') {
        Player.updatePlayerPaddle(gameState);
        Computer.updateComputerPaddleBehavior(gameState);
        
        world.step(Config.TIME_STEP, dt, 15); // Use dt for the second argument as well for more stability

        if (puckBody) {
            const speedSq = puckBody.velocity.lengthSquared();
            if (speedSq > Config.MAX_PUCK_SPEED * Config.MAX_PUCK_SPEED) {
                puckBody.velocity.scale(Config.MAX_PUCK_SPEED / Math.sqrt(speedSq), puckBody.velocity);
            }
            if (Math.abs(puckBody.position.x) > Config.OUT_OF_BOUNDS_XZ_LIMIT ||
                Math.abs(puckBody.position.z) > Config.OUT_OF_BOUNDS_XZ_LIMIT ||
                puckBody.position.y > Config.OUT_OF_BOUNDS_Y_LIMIT || // Less critical now
                puckBody.position.y < Config.FIXED_Y_OFFSET - Config.TABLE_LENGTH * 0.25 ) { // Less critical
                resetPaddlesAndPuck(); 
            }
        }

        const bodiesToLock = [puckBody, playerPaddleBody, computerPaddleBody];
        bodiesToLock.forEach(body => {
            if (body) {
                body.position.y = Config.FIXED_Y_OFFSET;
                body.velocity.y = 0;
                body.angularVelocity.x = 0; body.angularVelocity.z = 0;
                const yRot = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w), 'YXZ').y;
                body.quaternion.setFromEuler(0, yRot, 0, 'YXZ');
            }
        });
        checkGoal();
    }

    // Sync Three.js meshes with Cannon.js bodies
    if (puck && puckBody) { puck.position.copy(puckBody.position); puck.quaternion.copy(puckBody.quaternion); }
    if (playerPaddle && playerPaddleBody) { playerPaddle.position.copy(playerPaddleBody.position); playerPaddle.quaternion.copy(playerPaddleBody.quaternion); }
    if (computerPaddle && computerPaddleBody) { computerPaddle.position.copy(computerPaddleBody.position); computerPaddle.quaternion.copy(computerPaddleBody.quaternion); }

    if(renderer && scene && camera) renderer.render(scene, camera);
}

// Start the game
init();
