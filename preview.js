import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container = document.getElementById('jeeptoy-preview');

if (container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // Fondo blanco solicitado

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5); // Posición inicial de seguridad

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Iluminación extra para que no se vea negro contra el blanco
    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(5, 5, 5);
    scene.add(light);

    let jeep;
    const loader = new GLTFLoader();

    loader.load('models/jeeptoy.glb', (gltf) => {
        jeep = gltf.scene;

        // --- LÓGICA DE POSICIONAMIENTO AUTOMÁTICO ---
        const box = new THREE.Box3().setFromObject(jeep);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Forzamos al modelo a estar en el centro visual (0,0,0)
        jeep.position.x += (jeep.position.x - center.x);
        jeep.position.y += (jeep.position.y - center.y);
        jeep.position.z += (jeep.position.z - center.z);

        // Escalado automático: lo ajusta a 3 unidades de Three.js sin importar su tamaño original
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim; 
        jeep.scale.set(scale, scale, scale);

        scene.add(jeep);
    }, undefined, (error) => {
        console.error("Error: Verifica que models/jeeptoy.glb exista");
    });

    function animate() {
        requestAnimationFrame(animate);
        if (jeep) {
            jeep.rotation.y += 0.01; // Giro en bucle suave
        }
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}