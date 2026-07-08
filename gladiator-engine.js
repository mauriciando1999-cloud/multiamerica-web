/**
 * gladiator-engine.js 
 * Versión: Video Background HD
 */

const VIDEO_SETTINGS = {
    path: '/videos/jeep_bg.mp4', // Asegúrate de que el archivo exista en esta ruta
    overlayOpacity: 0.5,        // Controla qué tan oscuro se ve el video para resaltar el texto
    playbackRate: 0.9           // Un toque más lento para dar sensación de lujo
};

function initCinematicBackground() {
    const container = document.getElementById('gladiator-viewport');
    
    if (!container) {
        console.error("No se encontró el contenedor para el video background.");
        return;
    }

    // Limpiar cualquier residuo de Three.js (Canvas) si existiera
    container.innerHTML = '';

    // Crear elemento de video
    const video = document.createElement('video');
    
    // Atributos esenciales para reproducción automática y rendimiento
    video.src = VIDEO_SETTINGS.path;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true; 
    video.playbackRate = VIDEO_SETTINGS.playbackRate;

    // Estilos CSS vía JS para asegurar el "Cover" perfecto
    Object.assign(video.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        minWidth: '100%',
        minHeight: '100%',
        width: 'auto',
        height: 'auto',
        objectFit: 'cover',
        zIndex: '-1',
        opacity: '0',
        transition: 'opacity 1.5s ease-in-out'
    });

    // Capa de tinte (Overlay) para legibilidad del formulario
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: `rgba(0, 0, 0, ${VIDEO_SETTINGS.overlayOpacity})`,
        zIndex: '0'
    });

    container.appendChild(video);
    container.appendChild(overlay);

    // Aparecer el video suavemente cuando esté listo
    video.onloadeddata = () => {
        video.style.opacity = '1';
        console.log("🎬 Video HD: Ready.");
        
        // Disparar las animaciones de la interfaz (GSAP)
        if (typeof gsap !== 'undefined') {
            gsap.to(".reveal", { 
                opacity: 1, 
                y: 0, 
                stagger: 0.15, 
                duration: 1.2, 
                ease: "power4.out" 
            });
        }
    };

    // Manejo de errores
    video.onerror = () => {
        console.error("Error al cargar el video HD. Revisa la ruta.");
        container.style.background = "linear-gradient(45deg, #111, #333)";
    };
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initCinematicBackground);