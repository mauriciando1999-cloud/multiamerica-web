export const CONFIG = {
    jugador: { altura: 1.6, velocidad: 7.0 },
    archivos: {
        showroom: 'showroom.glb',
        garaje: 'garaje.glb',
        defaultVehiculo: 'jeep.glb',
        decoracion: 'jeep.glb'
    },
    vehiculo: { escala: 1.0, radioColision: 2.5 },
    queMostrarEnShowroom: 'muebles',
    showroomItems: { ancho: 0.5, profundidad: 0.5, alto: 3.0 },

    objetosShowroom: [
        { x: 10.59, z: -2.07, rot: -0.8 },
        { x: 10.99, z: -2.35, rot: 0.4  },
        { x: 11.31, z: -2.51, rot: 0.4  },
        { x: 11.8,  z: -2.66, rot: 0    },
        { x: 9.08,  z: -1.31, rot: 0    },
        { x: 11.27, z: 1.31,  rot: 0    },
        { x: 11.21, z: 0.83,  rot: 0    },
        { x: 10.78, z: 1.02,  rot: 0    },
        { x: 11.54, z: 1.05,  rot: 0    },
        { x: 13.66, z: 1.32,  rot: -0.8 },
        { x: 13.26, z: 1.62,  rot: 0.6  },
        { x: 12.84, z: 1.87,  rot: 0.4  },
        { x: 12.46, z: 1.83,  rot: 0.2  },
        { x: -8.55, z: -0.04, rot: 0    },
        { x: -8.76, z: 0.17,  rot: 0    },
        { x: -9.04, z: -0.11, rot: 0    },
        { x: -8.71, z: -0.2,  rot: 0    },
        { x: -5.44, z: 1.07,  rot: 0    }
    ],

    puestosGaraje: [
        // --- FILA DERECHA ---
        { x: 6.16, z: -12.61, rot: 0.73, modelo: 'honda_civic.glb', escala: 0.009, offsetY: 0.98, nombre: 'Honda Civic', año: '2015', precio: '$8,500' },
        { x: 12.58, z: -13.90, rot: -0.86, modelo: '2020_hyundai_santafe.glb', escala: 1.859, offsetY: 0.03, nombre: 'Hyundai Santa Fe', año: '2020', precio: '$22,000' },
        { x: 4.50, z: -32.00, rot: 1.57, modelo: '2007_dodge_caliber.glb', escala: 1.000, offsetY: 0.00, nombre: 'Dodge Caliber', año: '2007', precio: '$4,500' },
        { x: 11.50, z: -8.00, rot: -1.57, modelo: 'jeep.glb', escala: 1.000, offsetY: 0.00, nombre: 'Jeep Wrangler', año: '2018', precio: '$35,000' },
        { x: 4.50, z: -8.00, rot: 1.57, modelo: 'jeep.glb', escala: 1.000, offsetY: 0.00, nombre: 'Jeep Compass', año: '2019', precio: '$18,000' },
        
        // --- FILA IZQUIERDA ---
        { x: 12.52, z: -7.79, rot: 0.65, modelo: 'carro_kia_sportage_xnova360.glb', escala: 0.378, offsetY: -0.22, nombre: 'Kia Sportage', año: '2021', precio: '$24,000' },
        { x: 4.18, z: -9.03, rot: 1.00, modelo: 'toyota_4runner.glb', escala: 1.302, offsetY: -0.10, nombre: 'Toyota 4Runner TRD', año: '2022', precio: '$45,000' },
        { x: 3.76, z: -8.96, rot: 0.77, modelo: 'toyota_4runner.glb', escala: 0.008, offsetY: -0.05, nombre: 'Toyota 4Runner SR5', año: '2016', precio: '$28,000' },
        { x: 11.50, z: -32.00, rot: -1.57, modelo: '2023_chery_tiggo_9_awd.glb', escala: 1.000, offsetY: 0.00, nombre: 'Chery Tiggo 9 AWD', año: '2023', precio: '$32,000' },
        { x: 3.94, z: -15.02, rot: 0.81, modelo: 'daihatsu_terios.glb', escala: 0.010, offsetY: -0.04, nombre: 'Daihatsu Terios', año: '2008', precio: '$5,500' },
    ],

    limiteGarajeFallback: { xMin: 0.5, xMax: 16.0, zMin: -44.0, zMax: 1.0 }
};