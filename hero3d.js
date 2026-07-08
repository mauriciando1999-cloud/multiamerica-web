document.addEventListener("DOMContentLoaded", () => {
    const viewport = document.getElementById('viewport');
    if (typeof THREE === 'undefined' || !viewport) return;

    // 1. ESCENA, CÁMARA Y RENDERER
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Activar el motor de sombras suaves
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    viewport.appendChild(renderer.domElement);

    // 2. ILUMINACIÓN INTERACTIVA (EL FOCO DEL MOUSE)
    // Luz ambiental muy bajita para que la sala esté en penumbra y el foco resalte
    scene.add(new THREE.AmbientLight(0xffffff, 0.3)); 

    // Creamos un Foco de luz (SpotLight)
    const spotLight = new THREE.SpotLight(0xffffff, 5); // Alta intensidad
    spotLight.position.set(0, 40, 20); // Posición inicial alta
    spotLight.angle = Math.PI / 4; // Qué tan ancho es el haz de luz
    spotLight.penumbra = 0.5; // Bordes difuminados elegantes
    
    // Activamos la sombra del foco
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048; // Alta resolución
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 100;
    spotLight.shadow.bias = -0.001; 
    
    scene.add(spotLight);

    // 3. SEGUIMIENTO DEL MOUSE
    const mouse = new THREE.Vector2();
    window.addEventListener('mousemove', (event) => {
        // Convertimos la posición del mouse de píxeles a un rango de -1 a 1
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // 4. CARGA DE MODELOS Y ANIMACIONES GSAP
    const loader = new THREE.GLTFLoader();
    let jeep, showroom;

    function initScene() {
        if (!jeep || !showroom) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".scroll-section", start: "top top", end: "bottom bottom", scrub: 2, pin: true
            }
        });

        tl.to("#logo-overlay", { opacity: 0, scale: 0.5, duration: 1 }, 0);
        tl.to(jeep.position, { x: 0.00, y: -0.10, z: 12.75, ease: "none" }, 0);
        tl.to(jeep.rotation, { y: -0.47, ease: "none" }, 0);
        tl.to(showroom.position, { x: 1.40, y: -6.35, z: -23.95, ease: "none" }, 0);
        tl.to(showroom.rotation, { y: 5.85, ease: "none" }, 0);
        tl.to(showroom.scale, { x: 1.80, y: 1.80, z: 1.80, ease: "none" }, 0);

        tl.to("#grid-technical-text", { autoAlpha: 1, y: 0, duration: 1.5, ease: "power2.out" }, 0.2);
        tl.to("#texto-intro", { opacity: 1, x: 0, duration: 1.5 }, 0.4);
        tl.to("#sub-texto", { opacity: 1, x: 0, duration: 1.5 }, 0.6);
    }

    // EL TRUCO DEL PISO: Forzamos el material para que reaccione a la luz
    loader.load('models/textura-showroom.glb', (gltf) => {
        showroom = gltf.scene;
        showroom.traverse((node) => {
            if (node.isMesh) {
                node.receiveShadow = true;
                if (node.material) {
                    // Convertimos su material básico en uno "Standard" que lee sombras
                    node.material = new THREE.MeshStandardMaterial({
                        map: node.material.map,
                        color: node.material.color || 0xffffff,
                        roughness: 0.9, // Piso poco reflectante para que la sombra se vea clara
                        metalness: 0.1
                    });
                    node.material.needsUpdate = true;
                }
            }
        });
        scene.add(showroom);
        showroom.position.set(1.25, -6.50, -24.00);
        showroom.rotation.y = 4.65;
        initScene();
    });

    loader.load('models/jeep.glb', (gltf) => {
        jeep = gltf.scene;
        jeep.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true; 
                node.receiveShadow = true;
            }
        });
        scene.add(jeep);
        jeep.scale.set(9, 9, 9);
        jeep.position.set(-0.10, -0.15, 12.60);
        jeep.rotation.set(0, -1.57, 0);
        
        // Hacemos que el foco de luz siempre mire al jeep
        spotLight.target = jeep;
        
        initScene();
    });

    camera.position.z = 13;

    // 5. BUCLE DE RENDER (Donde ocurre la magia del mouse)
    function animate() {
        requestAnimationFrame(animate);
        
        // Mover el foco de luz en el eje X y Z dependiendo de dónde esté el mouse
        // Usamos una transición suave matemática para que no sea un movimiento brusco
        spotLight.position.x += (mouse.x * 40 - spotLight.position.x) * 0.05;
        spotLight.position.z += (20 + (mouse.y * -20) - spotLight.position.z) * 0.05;

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});