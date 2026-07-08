import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CONFIG } from './config.js';
import { murosColision, crearHitbox, dibujarRuta, checkObjectCollision, limpiarMuros } from './physics.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const loader = new GLTFLoader();
const clock = new THREE.Clock();
const sun = new THREE.DirectionalLight(0xffffff, 1.8);

let currentScene = '';
let mainModel = null;
let teleportSphere = null;
let vehiculos = [];
let decoraciones = [];

const PUNTOS = {
    spawnShowroom: { x: 13.0, z: 0.0 },
    mesaShowroom:  new THREE.Vector3(-8.67, 1.8, 0.04),
    spawnGaraje:   { x: 8.24, z: -2.0 },
    retornoGaraje: new THREE.Vector3(8.0, 1.8, -1.0)
};

function init() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.0;
    document.body.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    scene.add(sun);
    loadWorld(CONFIG.archivos.showroom, PUNTOS.spawnShowroom);
    animate();
}

function loadWorld(modelName, spawnPos) {
    if (mainModel) scene.remove(mainModel);
    if (teleportSphere) scene.remove(teleportSphere);
    [...vehiculos, ...decoraciones].forEach(obj => scene.remove(obj));
    vehiculos = []; decoraciones = [];
    limpiarMuros(scene);
    
    currentScene = modelName;

    loader.load(`./models/${modelName}`, (gltf) => {
        mainModel = gltf.scene;
        scene.add(mainModel);
        camera.position.set(spawnPos.x, CONFIG.jugador.altura, spawnPos.z);
        
        // Esfera de teletransporte
        const color = (modelName === CONFIG.archivos.showroom) ? 0xFF8801 : 0x00AAFF;
        teleportSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 32, 32),
            new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2 })
        );
        teleportSphere.position.copy((modelName === CONFIG.archivos.showroom) ? PUNTOS.mesaShowroom : PUNTOS.retornoGaraje);
        scene.add(teleportSphere);

        cargarArquitecturaYObjetos(modelName);
    });
}

function cargarArquitecturaYObjetos(modelName) {
    if (modelName === CONFIG.archivos.showroom) {
        sun.position.set(1.00, 18.20, 9.77); 

        // RESTAURADO: Hitboxes del Showroom
        const grosorMuro = 0.15;
        const rutaFrontal = [{ x: 8.52, z: 0.84 }, { x: -4.95, z: 0.87 }];
        const rutaTrasera = [{ x: 8.47, z: -1.22 }, { x: -4.86, z: -1.17 }];
        const curvaDer = [{ x: 8.42, z: -1.05 }, { x: 8.93, z: -2.46 }, { x: 9.76, z: -3.26 }, { x: 10.99, z: -3.96 }, { x: 12.23, z: -4.28 }, { x: 13.42, z: -4.13 }, { x: 14.8, z: -3.55 }, { x: 16.12, z: -1.97 }, { x: 16.41, z: -0.44 }, { x: 16.34, z: 1.38 }, { x: 15.43, z: 2.55 }, { x: 13.28, z: 3.95 }, { x: 11.21, z: 3.85 }, { x: 9.27, z: 2.49 }, { x: 8.46, z: 0.86 }];
        const curvaIzq = [{ x: -4.9, z: 0.82 }, { x: -5.69, z: 2.29 }, { x: -6.67, z: 3.11 }, { x: -8.17, z: 3.77 }, { x: -9.73, z: 3.66 }, { x: -12.11, z: 2.04 }, { x: -12.82, z: 0 }, { x: -12.46, z: -1.82 }, { x: -11.19, z: -3.45 }, { x: -9.15, z: -4.17 }, { x: -7.03, z: -3.67 }, { x: -5.47, z: -2.34 }, { x: -4.91, z: -0.98 }];

        dibujarRuta(scene, rutaFrontal, grosorMuro, false);
        dibujarRuta(scene, rutaTrasera, grosorMuro, false);
        dibujarRuta(scene, curvaDer, grosorMuro, false);
        dibujarRuta(scene, curvaIzq, grosorMuro, false);
        
        // RESTAURADO: Carga de Muebles en Showroom
        if (CONFIG.queMostrarEnShowroom !== 'nada' && CONFIG.objetosShowroom) {
            const modShow = CONFIG.queMostrarEnShowroom === 'carros' ? CONFIG.archivos.vehiculo : CONFIG.archivos.decoracion;
            loader.load(`./models/${modShow}`, (gltf) => {
                CONFIG.objetosShowroom.forEach(p => {
                    const clon = gltf.scene.clone();
                    clon.position.set(p.x, 0, p.z);
                    clon.rotation.y = p.rot;
                    // Mantenemos escala global solo para muebles
                    clon.scale.set(CONFIG.vehiculo.escala, CONFIG.vehiculo.escala, CONFIG.vehiculo.escala);
                    scene.add(clon);
                    decoraciones.push(clon);
                });
            });
        }

    } else if (modelName === CONFIG.archivos.garaje) {
        sun.position.set(-5.79, 29.30, -32.56);
        
        // RESTAURADO: Hitbox perimetral del garaje
        dibujarRuta(scene, [
            { x: 0.20, z: -0.18 }, { x: 15.85, z: -0.20 },
            { x: 15.85, z: -45.80 }, { x: 0.20, z: -46.05 }, { x: 0.20, z: -0.18 }
        ], 0.5, false);

        // AQUÍ ESTÁ LA MAGIA DE TU EDITOR: Carga inteligente de carros
        if (CONFIG.puestosGaraje) {
            CONFIG.puestosGaraje.forEach(p => {
                const archivo = p.modelo ? p.modelo : CONFIG.archivos.defaultVehiculo;
                loader.load(`./models/${archivo}`, (gltf) => {
                    const auto = gltf.scene;
                    
                    // Aplica tus cálculos del editor
                    const s = p.escala !== undefined ? p.escala : 1.0;
                    auto.scale.set(s, s, s);
                    
                    const y = p.offsetY !== undefined ? p.offsetY : 0;
                    auto.position.set(p.x, y, p.z);
                    
                    auto.rotation.y = p.rot;
                    
                    scene.add(auto);
                    vehiculos.push(auto);
                });
            });
        }
    }
}

// --- HUD Y CONTROLES (RESTAURADOS) ---
const controls = new PointerLockControls(camera, document.body);
const hud = document.getElementById('hud');

document.addEventListener('click', () => {
    if (!controls.isLocked) {
        controls.lock();
    } else {
        // Lógica de Teletransporte
        const target = (currentScene === CONFIG.archivos.showroom) ? PUNTOS.mesaShowroom : PUNTOS.retornoGaraje;
        if (camera.position.distanceTo(target) < 3.5) {
            const nxt = (currentScene === CONFIG.archivos.showroom) ? CONFIG.archivos.garaje : CONFIG.archivos.showroom;
            const pos = (currentScene === CONFIG.archivos.showroom) ? PUNTOS.spawnGaraje : PUNTOS.spawnShowroom;
            loadWorld(nxt, pos);
        }
    }
});

controls.addEventListener('lock', () => { if(hud) hud.style.display = 'none'; });
controls.addEventListener('unlock', () => { if(hud) hud.style.display = 'block'; });

let keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        const delta = clock.getDelta();
        const speed = CONFIG.jugador.velocidad * delta;
        const prevPos = camera.position.clone();

        if (keys['KeyW']) controls.moveForward(speed);
        if (keys['KeyS']) controls.moveForward(-speed);
        if (keys['KeyA']) controls.moveRight(-speed);
        if (keys['KeyD']) controls.moveRight(speed);

        // RESTAURADO: Chequeo de colisión tanto para muros como para carros
        let choco = false;
        for (let box of murosColision) {
            if (box.clone().expandByScalar(0.2).containsPoint(camera.position)) choco = true;
        }
        if (choco || checkObjectCollision(camera.position, currentScene)) {
            camera.position.copy(prevPos);
        }
        camera.position.y = CONFIG.jugador.altura;
    }
    renderer.render(scene, camera);
}

// Resize ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();