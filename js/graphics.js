//graphics.js

// js/graphics.js
import * as Config from './config.js';

let scene, camera, renderer;

export function initThree() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, Config.TABLE_LENGTH / 1.05, Config.TABLE_LENGTH / 1.6);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xadc8ff, 0.75);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e1, 1.1);
    keyLight.position.set(Config.TABLE_WIDTH * 0.6, 12, Config.TABLE_LENGTH * 0.25);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048; keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5; keyLight.shadow.camera.far = 28;
    keyLight.shadow.camera.left = -Config.TABLE_WIDTH; keyLight.shadow.camera.right = Config.TABLE_WIDTH;
    keyLight.shadow.camera.top = Config.TABLE_LENGTH * 0.8; keyLight.shadow.camera.bottom = -Config.TABLE_LENGTH * 0.8;
    scene.add(keyLight);
    
    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.4);
    fillLight.position.set(-Config.TABLE_WIDTH * 0.5, 8, Config.TABLE_LENGTH * 0.6);
    scene.add(fillLight);

    window.addEventListener('resize', onWindowResize, false);
    return { scene, camera, renderer };
}

export function onWindowResize() {
    if(camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

