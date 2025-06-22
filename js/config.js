// js/config.js

// --- Game Dimensions & Object Properties ---
export const TABLE_WIDTH = 4;
export const TABLE_LENGTH = 8;
export const TABLE_HEIGHT = 0.1;
export const WALL_HEIGHT = 0.3;
export const WALL_THICKNESS = 0.1;
export const GOAL_WIDTH = TABLE_WIDTH * 0.4;
export const PUCK_RADIUS = 0.15;
export const PADDLE_RADIUS = 0.25;
export const UNIFIED_THICKNESS = 0.15;
export const FIXED_Y_OFFSET = UNIFIED_THICKNESS / 2;

export const PUCK_MASS = 0.1;
export const PADDLE_MASS = 0.5;

export const PLAYER_START_Z = TABLE_LENGTH / 2 - PADDLE_RADIUS * 2.5;
export const COMPUTER_START_Z = -TABLE_LENGTH / 2 + PADDLE_RADIUS * 2.5;

// --- Base Computer Behavior Constants (some might be overridden by difficulty) ---
export const COMPUTER_MAX_Z_VELOCITY_RATIO = 0.9;
export const COMPUTER_ENGAGE_ZONE_Z_MAX = TABLE_LENGTH * 0.02;
export const COMPUTER_ENGAGE_PUCK_MIN_VEL_ANY_DIR = 0.08;
export const COMPUTER_MAX_FORWARD_TARGET_Z_ENGAGE = -PADDLE_RADIUS * 1.0;
export const COMPUTER_REACTION_ZONE_Z_START = TABLE_LENGTH * 0.38;
export const COMPUTER_PUCK_MIN_THREAT_VEL_Z = -0.18;
export const COMPUTER_INTERCEPT_X_ALIGN_THRESHOLD = PADDLE_RADIUS * 2.2;
export const COMPUTER_INTERCEPT_Z_REACH_AHEAD = PADDLE_RADIUS * 0.85;
export const COMPUTER_INTERCEPT_Z_EFFECTIVE_RANGE = PADDLE_RADIUS * 3.0;
export const COMPUTER_DEFAULT_DEFENSIVE_Z_OFFSET = PADDLE_RADIUS * 0.05;
export const COMPUTER_UNSTICK_CHECK_DISTANCE_Z = PADDLE_RADIUS * 1.5;
export const COMPUTER_UNSTICK_SIDE_HIT_OFFSET_X = PADDLE_RADIUS * 1.25;

// --- Computer Parameters by Difficulty ---
export const computerParamsByDifficulty = {
    EASY: {
        speed: 6.8,
        lookAheadTime: 0.05,
        kpXFactor: 0.75,
        kpZFactor: 0.70,
        returnToCenterSpeedFactor: 0.09,
        engageTargetZOffsetFactor: 1.25,
        unstickAggressionZFactor: 1.4,
    },
    MEDIUM: {
        speed: 8.2,
        lookAheadTime: 0.09,
        kpXFactor: 0.95,
        kpZFactor: 0.85,
        returnToCenterSpeedFactor: 0.12,
        engageTargetZOffsetFactor: 1.5,
        unstickAggressionZFactor: 1.7,
    },
    HARD: {
        speed: 9.6,
        lookAheadTime: 0.11,
        kpXFactor: 1.05,
        kpZFactor: 1.0,
        returnToCenterSpeedFactor: 0.14,
        engageTargetZOffsetFactor: 1.75,
        unstickAggressionZFactor: 2.0,
    }
};

// --- Gameplay Constants ---
export const MAX_PUCK_SPEED = 10;
export const OUT_OF_BOUNDS_Y_LIMIT = FIXED_Y_OFFSET + TABLE_LENGTH * 0.3; // Might need adjustment based on how Y is handled
export const OUT_OF_BOUNDS_XZ_LIMIT = TABLE_LENGTH * 0.7;

// Physics timestep
export const TIME_STEP = 1 / 60;