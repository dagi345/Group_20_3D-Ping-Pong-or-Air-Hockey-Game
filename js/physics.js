// physics.js
// js/physics.js
let world;
let puckMaterial, paddleMaterial, wallMaterial;

export function initCannon() {
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.allowSleep = true;
    world.solver.iterations = 20; 

    puckMaterial = new CANNON.Material('puckMaterial');
    paddleMaterial = new CANNON.Material('paddleMaterial');
    wallMaterial = new CANNON.Material('wallMaterial');
    
    return { world, puckMaterial, paddleMaterial, wallMaterial };
}

export function setupContactMaterials(_world, _puckMaterial, _paddleMaterial, _wallMaterial) {
    _world.addContactMaterial(new CANNON.ContactMaterial(_puckMaterial, _wallMaterial, { friction: 0.025, restitution: 0.92 }));
    _world.addContactMaterial(new CANNON.ContactMaterial(_puckMaterial, _paddleMaterial, { friction: 0.025, restitution: 0.98 }));
    _world.addContactMaterial(new CANNON.ContactMaterial(_paddleMaterial, _wallMaterial, { friction: 0.06, restitution: 0.15 }));
}


