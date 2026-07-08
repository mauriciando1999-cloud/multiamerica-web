import * as THREE from 'three';
import { CONFIG } from './config.js';

export let murosColision = [];

export function limpiarMuros(scene) {
    murosColision = [];
}

export function crearHitbox(scene, x, z, ancho, profundidad, esVisible = false) {
    const geo = new THREE.BoxGeometry(ancho, 4, profundidad);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, visible: esVisible });
    const muro = new THREE.Mesh(geo, mat);
    
    muro.position.set(x, 2, z);
    if (esVisible) scene.add(muro);
    
    muro.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(muro);
    murosColision.push(box);
}

export function dibujarRuta(scene, arrayPuntos, grosor, esVisible) {
    for (let i = 0; i < arrayPuntos.length - 1; i++) {
        const p1 = arrayPuntos[i]; 
        const p2 = arrayPuntos[i + 1];
        const dist = Math.hypot(p2.x - p1.x, p2.z - p1.z);
        const pasos = Math.max(2, Math.floor(dist / 0.3)); 
        
        for(let j = 0; j <= pasos; j++) {
            const t = j / pasos;
            const x = p1.x + (p2.x - p1.x) * t;
            const z = p1.z + (p2.z - p1.z) * t;
            crearHitbox(scene, x, z, grosor, grosor, esVisible);
        }
    }
}

export function checkObjectCollision(newPos, currentScene) {
    // Protección: Solo revisar carros si estamos en el garaje y existen puestos
    if (currentScene === CONFIG.archivos.garaje && CONFIG.puestosGaraje) {
        for (let p of CONFIG.puestosGaraje) {
            const dx = newPos.x - p.x;
            const dz = newPos.z - p.z;
            const radio = CONFIG.vehiculo.radioColision || 2.5;
            if ((dx * dx + dz * dz) < (radio * radio)) return true;
        }
    }
    return false;
}