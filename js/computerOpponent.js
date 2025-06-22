//computerOpponent.js

// js/computerOpponent.js
import * as Config from './config.js';

let puckBodyRef;
let computerPaddleBodyRef;
let currentComputerParams = {}; // To be set by main.js

export function setComputerOpponentReferences(puckB, computerB) {
    puckBodyRef = puckB;
    computerPaddleBodyRef = computerB;
}

export function updateComputerParameters(params) {
    currentComputerParams = {
        speed: params.currentComputerSpeed,
        lookAheadTime: params.currentComputerLookAheadTime,
        kpXFactor: params.currentComputerKpXFactor,
        kpZFactor: params.currentComputerKpZFactor,
        returnToCenterSpeedFactor: params.currentComputerReturnToCenterSpeedFactor,
        engageTargetZOffset: params.currentComputerEngageTargetZOffset,
        unstickAggressionZFactor: params.currentComputerUnstickAggressionZFactor,
    };
}


export function updateComputerPaddleBehavior(gameState) {
    if (!puckBodyRef || !computerPaddleBodyRef || gameState !== 'PLAYING' || !currentComputerParams.speed) return;

    const puckPos = puckBodyRef.position; 
    const puckVel = puckBodyRef.velocity;
    const computerPos = computerPaddleBodyRef.position;
    
    let targetX = 0; 
    let targetZ = Config.COMPUTER_START_Z + Config.COMPUTER_DEFAULT_DEFENSIVE_Z_OFFSET;

    const PUCK_IN_COMPUTER_HALF = puckPos.z < 0;
    const PUCK_MOVING_TOWARDS_COMPUTER_GOAL = puckVel.z < Config.COMPUTER_PUCK_MIN_THREAT_VEL_Z;
    const PUCK_IS_PLAYABLE_FOR_ENGAGE = Math.abs(puckVel.x) > Config.COMPUTER_ENGAGE_PUCK_MIN_VEL_ANY_DIR || Math.abs(puckVel.z) > Config.COMPUTER_ENGAGE_PUCK_MIN_VEL_ANY_DIR || PUCK_MOVING_TOWARDS_COMPUTER_GOAL;

    let isDirectThreat = (PUCK_IN_COMPUTER_HALF && PUCK_MOVING_TOWARDS_COMPUTER_GOAL && puckPos.z < Config.COMPUTER_REACTION_ZONE_Z_START);
    let isEngageable = (PUCK_IN_COMPUTER_HALF && puckPos.z > (Config.COMPUTER_START_Z + Config.PADDLE_RADIUS) && PUCK_IS_PLAYABLE_FOR_ENGAGE && !isDirectThreat);
    let isStuckScenario = false;

    if (puckPos.z < computerPos.z && Math.abs(puckPos.z - computerPos.z) < Config.COMPUTER_UNSTICK_CHECK_DISTANCE_Z &&
        puckPos.z < (Config.COMPUTER_START_Z + Config.PADDLE_RADIUS * 2.0) && PUCK_IN_COMPUTER_HALF) {
        isStuckScenario = true; 
        isDirectThreat = false; 
        isEngageable = false;
    }

    if (isStuckScenario) {
        targetZ = puckPos.z - Config.PADDLE_RADIUS * 1.3;
        targetX = (Math.abs(puckPos.x - computerPos.x) < Config.PADDLE_RADIUS * 1.3) ?
            puckPos.x + (puckPos.x > computerPos.x ? -Config.COMPUTER_UNSTICK_SIDE_HIT_OFFSET_X : Config.COMPUTER_UNSTICK_SIDE_HIT_OFFSET_X) * (Math.random() * 0.2 + 0.9) :
            puckPos.x;
        targetZ = Math.max(targetZ, -Config.TABLE_LENGTH / 2 + Config.PADDLE_RADIUS * 0.8);
    } else if (isDirectThreat) {
        targetX = puckPos.x + puckVel.x * currentComputerParams.lookAheadTime;
        if (Math.abs(puckPos.x - computerPos.x) < Config.COMPUTER_INTERCEPT_X_ALIGN_THRESHOLD &&
            (computerPos.z - puckPos.z) > 0 && (computerPos.z - puckPos.z) < Config.COMPUTER_INTERCEPT_Z_EFFECTIVE_RANGE && puckVel.z < -0.05) {
            targetZ = Math.max(Config.COMPUTER_START_Z - Config.COMPUTER_INTERCEPT_Z_REACH_AHEAD, puckPos.z + Config.PADDLE_RADIUS * 1.15);
        } else { 
            targetZ = Config.COMPUTER_START_Z + Config.COMPUTER_DEFAULT_DEFENSIVE_Z_OFFSET; 
        }
    } else if (isEngageable) {
        targetX = puckPos.x + puckVel.x * currentComputerParams.lookAheadTime * 0.55;
        targetZ = puckPos.z + currentComputerParams.engageTargetZOffset;
        targetZ = Math.min(targetZ, Config.COMPUTER_MAX_FORWARD_TARGET_Z_ENGAGE);
        targetZ = Math.max(targetZ, Config.COMPUTER_START_Z - Config.PADDLE_RADIUS * 0.5);
    } else {
        targetX = 0;
        targetZ = (Math.abs(computerPos.z - (Config.COMPUTER_START_Z + Config.COMPUTER_DEFAULT_DEFENSIVE_Z_OFFSET)) > Config.PADDLE_RADIUS * 0.1) ?
            Config.COMPUTER_START_Z + Config.COMPUTER_DEFAULT_DEFENSIVE_Z_OFFSET : computerPos.z;
    }
  

    const errorX = targetX - computerPos.x; 
    let errorZ = targetZ - computerPos.z;
    let desiredVelX, desiredVelZ;
    let currentKpZ = currentComputerParams.kpZFactor;
    let currentMaxSpeed = currentComputerParams.speed;

    if (isStuckScenario) {
        desiredVelX = errorX * currentComputerParams.speed * currentComputerParams.kpXFactor * 1.35;
        desiredVelZ = errorZ * currentComputerParams.speed * currentKpZ * currentComputerParams.unstickAggressionZFactor;
        currentMaxSpeed *= 1.25;
    } else if (isDirectThreat || isEngageable) {
        desiredVelX = errorX * currentComputerParams.speed * currentComputerParams.kpXFactor;
        desiredVelZ = errorZ * currentComputerParams.speed * currentKpZ * (isEngageable ? 1.25 : 1.0);
    } else { // Return to center
        desiredVelX = errorX * currentComputerParams.speed * currentComputerParams.returnToCenterSpeedFactor;
        desiredVelZ = errorZ * currentComputerParams.speed * currentComputerParams.returnToCenterSpeedFactor * 0.3;
    }

    let maxZVelRatio = (isStuckScenario || isEngageable) ? Config.COMPUTER_MAX_Z_VELOCITY_RATIO * 1.08 : Config.COMPUTER_MAX_Z_VELOCITY_RATIO;
    desiredVelZ = Math.max(-currentComputerParams.speed * maxZVelRatio, Math.min(currentComputerParams.speed * maxZVelRatio, desiredVelZ));
    const desiredSpeedSq = desiredVelX * desiredVelX + desiredVelZ * desiredVelZ;
    if (desiredSpeedSq > currentMaxSpeed * currentMaxSpeed) {
        const speed = Math.sqrt(desiredSpeedSq);
        desiredVelX = (desiredVelX / speed) * currentMaxSpeed;
        desiredVelZ = (desiredVelZ / speed) * currentMaxSpeed;
    }
    computerPaddleBodyRef.velocity.x = desiredVelX; 
    computerPaddleBodyRef.velocity.z = desiredVelZ;

    const maxPX_Computer = Config.TABLE_WIDTH / 2 - Config.PADDLE_RADIUS - Config.WALL_THICKNESS * 0.02;
    const minZ_Computer = -Config.TABLE_LENGTH / 2 + Config.PADDLE_RADIUS * 0.85;
    const maxZ_Computer_PHYSICAL = Config.COMPUTER_MAX_FORWARD_TARGET_Z_ENGAGE + Config.PADDLE_RADIUS * 0.4;

    if (computerPos.x < -maxPX_Computer) { computerPaddleBodyRef.position.x = -maxPX_Computer; if(computerPaddleBodyRef.velocity.x < 0) computerPaddleBodyRef.velocity.x *= -0.5;}
    if (computerPos.x > maxPX_Computer)  { computerPaddleBodyRef.position.x =  maxPX_Computer; if(computerPaddleBodyRef.velocity.x > 0) computerPaddleBodyRef.velocity.x *= -0.5;}
    if (computerPos.z < minZ_Computer)   { computerPaddleBodyRef.position.z =  minZ_Computer;  if(computerPaddleBodyRef.velocity.z < 0) computerPaddleBodyRef.velocity.z *= -0.5;}
    if (computerPos.z > maxZ_Computer_PHYSICAL) { computerPaddleBodyRef.position.z = maxZ_Computer_PHYSICAL; if(computerPaddleBodyRef.velocity.z > 0) computerPaddleBodyRef.velocity.z *= -0.6;}
}


