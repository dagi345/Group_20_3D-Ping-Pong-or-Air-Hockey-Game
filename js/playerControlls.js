//playerControlls.js
// js/playerControls.js
import * as Config from './config.js';

let mouse, raycaster, plane;
export let playerTargetPos = new THREE.Vector3(); // Export if main.js needs to reset it
let gameCamera; // To be set by main.js
let playerPaddleBodyRef; // To be set by main.js

export function initPlayerControls(camera, paddleBody) {
    gameCamera = camera;
    playerPaddleBodyRef = paddleBody;

    mouse = new THREE.Vector2();
    raycaster = new THREE.Raycaster();
    plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -Config.FIXED_Y_OFFSET); // Intersect at paddle height

    document.addEventListener('mousemove', onPointerMove, false);
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('touchstart', onPointerMove, { passive: false });
}

function onPointerMove(event) {
    if (!gameCamera) return;
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
        event.preventDefault(); // Prevent scrolling on touch
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    updateMousePosition(clientX, clientY);
}

function updateMousePosition(clientX, clientY) {
    if (!gameCamera || !raycaster || !plane) return;
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, gameCamera);

    if (raycaster.ray.intersectPlane(plane, playerTargetPos)) {
        const maxPX = Config.TABLE_WIDTH / 2 - Config.PADDLE_RADIUS - Config.WALL_THICKNESS * 0.05;
        const minPZ = 0 + Config.PADDLE_RADIUS + Config.WALL_THICKNESS * 0.05; // Player's half
        const maxPZ = Config.TABLE_LENGTH / 2 - Config.PADDLE_RADIUS - Config.WALL_THICKNESS * 0.05;
        
        playerTargetPos.x = Math.max(-maxPX, Math.min(maxPX, playerTargetPos.x));
        playerTargetPos.z = Math.max(minPZ, Math.min(maxPZ, playerTargetPos.z));
        playerTargetPos.y = Config.FIXED_Y_OFFSET; // Ensure target Y is correct
    }
}

export function updatePlayerPaddle(gameState) {
    if (!playerPaddleBodyRef || !playerTargetPos || gameState !== 'PLAYING') return;
    
    const speedFactor = 25;
    let velX = (playerTargetPos.x - playerPaddleBodyRef.position.x) * speedFactor;
    let velZ = (playerTargetPos.z - playerPaddleBodyRef.position.z) * speedFactor;
    
    const maxSpeed = 22;
    const currentSpeedSq = velX * velX + velZ * velZ;
    if (currentSpeedSq > maxSpeed * maxSpeed) {
        const currentSpeed = Math.sqrt(currentSpeedSq);
        velX = (velX / currentSpeed) * maxSpeed;
        velZ = (velZ / currentSpeed) * maxSpeed;
    }
    playerPaddleBodyRef.velocity.x = velX;
    playerPaddleBodyRef.velocity.z = velZ;
}


