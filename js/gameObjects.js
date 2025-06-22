//gameObjects.js

// js/gameObjects.js
import * as Config from './config.js';

let tableSurfaceMesh; // Keep track if needed elsewhere, otherwise local

// Helper function, could be private to this module if not needed elsewhere
function createWallSegment(x, z, w, h, d, scene, world, wallMaterial) {
    const wallGeo = new THREE.BoxGeometry(w, h, d);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a4e69, metalness: 0.02, roughness: 0.92 });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(x, h / 2 - Config.TABLE_HEIGHT / 2, z);
    wallMesh.castShadow = true; wallMesh.receiveShadow = true;
    scene.add(wallMesh);

    const wallShape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
    const wallBody = new CANNON.Body({ mass: 0, material: wallMaterial });
    wallBody.addShape(wallShape);
    wallBody.position.set(x, h / 2 - Config.TABLE_HEIGHT / 2, z);
    world.addBody(wallBody);
}

export function createTable(scene, world, wallMaterial) {
    const tableGeometry = new THREE.BoxGeometry(Config.TABLE_WIDTH, Config.TABLE_HEIGHT, Config.TABLE_LENGTH);
    const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x2b303a, metalness: 0.05, roughness: 0.75 });
    tableSurfaceMesh = new THREE.Mesh(tableGeometry, tableMaterial);
    tableSurfaceMesh.position.y = -Config.TABLE_HEIGHT / 2;
    tableSurfaceMesh.receiveShadow = true;
    scene.add(tableSurfaceMesh);

    const wallPositions = [
        { x: 0, z: Config.TABLE_LENGTH / 2 + Config.WALL_THICKNESS / 2, w: Config.TABLE_WIDTH, d: Config.WALL_THICKNESS, isGoalWall: true },
        { x: 0, z: -Config.TABLE_LENGTH / 2 - Config.WALL_THICKNESS / 2, w: Config.TABLE_WIDTH, d: Config.WALL_THICKNESS, isGoalWall: true },
        { x: Config.TABLE_WIDTH / 2 + Config.WALL_THICKNESS / 2, z: 0, w: Config.WALL_THICKNESS, d: Config.TABLE_LENGTH, isGoalWall: false },
        { x: -Config.TABLE_WIDTH / 2 - Config.WALL_THICKNESS / 2, z: 0, w: Config.WALL_THICKNESS, d: Config.TABLE_LENGTH, isGoalWall: false }
    ];

    wallPositions.forEach(pos => {
        if (pos.isGoalWall) {
            const segmentWidth = (pos.w - Config.GOAL_WIDTH - Config.WALL_THICKNESS * 1.5) / 2;
            if (segmentWidth > 0) {
                createWallSegment(pos.x - (Config.GOAL_WIDTH / 2 + segmentWidth / 2), pos.z, segmentWidth, Config.WALL_HEIGHT, pos.d, scene, world, wallMaterial);
                createWallSegment(pos.x + (Config.GOAL_WIDTH / 2 + segmentWidth / 2), pos.z, segmentWidth, Config.WALL_HEIGHT, pos.d, scene, world, wallMaterial);
            }
        } else { 
            createWallSegment(pos.x, pos.z, pos.w, Config.WALL_HEIGHT, pos.d, scene, world, wallMaterial); 
        }
    });

    const lineY = 0.005; 
    const goalLineMat = new THREE.LineBasicMaterial({ color: 0xffa07a, linewidth: 2.5 });
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-Config.GOAL_WIDTH/2, lineY, Config.TABLE_LENGTH/2), new THREE.Vector3(Config.GOAL_WIDTH/2, lineY, Config.TABLE_LENGTH/2)]), goalLineMat));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-Config.GOAL_WIDTH/2, lineY, -Config.TABLE_LENGTH/2), new THREE.Vector3(Config.GOAL_WIDTH/2, lineY, -Config.TABLE_LENGTH/2)]), goalLineMat));
    const centerLineMat = new THREE.LineBasicMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.25, linewidth: 2.5 });
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-Config.TABLE_WIDTH/2, lineY, 0), new THREE.Vector3(Config.TABLE_WIDTH/2, lineY, 0)]), centerLineMat));
    // return tableSurfaceMesh; // if needed
}


export function createPuck(scene, world, puckMaterial) {
    const puckGeo = new THREE.CylinderGeometry(Config.PUCK_RADIUS, Config.PUCK_RADIUS, Config.UNIFIED_THICKNESS, 32);
    const puckMat = new THREE.MeshStandardMaterial({ color: 0x0a0f0d, metalness: 0.6, roughness: 0.05 });
    const puckMesh = new THREE.Mesh(puckGeo, puckMat);
    puckMesh.castShadow = true; 
    puckMesh.position.y = Config.FIXED_Y_OFFSET;
    scene.add(puckMesh);

    const puckShape = new CANNON.Sphere(Config.PUCK_RADIUS);
    const puckBody = new CANNON.Body({
        mass: Config.PUCK_MASS,
        material: puckMaterial,
        linearDamping: 0.12,
        angularDamping: 0.25
    });
    puckBody.addShape(puckShape);
    puckBody.position.set(0, Config.FIXED_Y_OFFSET, 0);
    puckBody.userData = {};
    puckBody.collisionResponse = 1; 
    puckBody.ccdSpeedThreshold = (Config.PUCK_RADIUS / Config.TIME_STEP) * 0.8; 
    if (puckBody.ccdSpeedThreshold < 0.5) puckBody.ccdSpeedThreshold = 0.5;
    puckBody.ccdSweptSphereRadius = Config.PUCK_RADIUS;
    world.addBody(puckBody);

    return { mesh: puckMesh, body: puckBody };
}

// Generic paddle creation, used by player and computer
function createPaddleObject(isPlayer, scene, world, paddleMaterial) {
    const paddleGeo = new THREE.CylinderGeometry(Config.PADDLE_RADIUS, Config.PADDLE_RADIUS * 0.6, Config.UNIFIED_THICKNESS, 32);
    const color = isPlayer ? 0xf07167 : 0x00afb9;
    const mat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.2, roughness: 0.3 });
    const mesh = new THREE.Mesh(paddleGeo, mat);
    mesh.castShadow = true; 
    mesh.position.y = Config.FIXED_Y_OFFSET;
    scene.add(mesh);

    const shape = new CANNON.Sphere(Config.PADDLE_RADIUS);
    const body = new CANNON.Body({ 
        mass: Config.PADDLE_MASS, 
        material: paddleMaterial, 
        linearDamping: 0.55, 
        angularDamping: 0.65 
    });
    body.addShape(shape);
    body.position.set(0, Config.FIXED_Y_OFFSET, isPlayer ? Config.PLAYER_START_Z : Config.COMPUTER_START_Z);
    world.addBody(body);

    return { mesh, body };
}

export function createPlayerPaddle(scene, world, paddleMaterial) { 
    return createPaddleObject(true, scene, world, paddleMaterial);
}
export function createComputerPaddle(scene, world, paddleMaterial) { 
    return createPaddleObject(false, scene, world, paddleMaterial);
}


