// ==========================================
// CONFIGURACIÓN Y ESTADO
// ==========================================
let inventarioMaster = [];
let fotoIndices = {};
let carrito = JSON.parse(sessionStorage.getItem("carrito_multiamerica")) || [];
let categoriaActual = "Todas";
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const vActual = urlParams.get('v');
    const vGuardado = localStorage.getItem('last_vendedor');

    const perfEntries = performance.getEntriesByType("navigation");
    const isReload = perfEntries.length > 0 && perfEntries[0].type === "reload";

    if (isReload || (vActual && vActual !== vGuardado)) {
        localStorage.clear();
        sessionStorage.clear();
        if (vActual) localStorage.setItem('last_vendedor', vActual);
        carrito = [];
    }

    inicializarAtribucion();
    cargarInventario();
    
    document.getElementById('buscador').addEventListener('input', filtrarTodo);
});

// ==========================================
// LÓGICA DE DATOS
// ==========================================
async function cargarInventario() {
    try {
        const client = (typeof _supabase !== 'undefined') ? _supabase : supabase;
        const { data, error } = await client
            .from('inventario')
            .select('*')
            .eq('estatus', 'Disponible')
            .order('creado_el', { ascending: false });

        if (error) throw error;

        if (data) {
            inventarioMaster = data;
            data.forEach(c => { fotoIndices[c.id] = 0; });
            filtrarTodo(); 
        }
    } catch (e) { 
        console.error("Error cargando inventario:", e);
        document.getElementById('inventory-grid').innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <i class="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
                <h3 class="font-title font-black uppercase italic text-2xl">Error de conexión</h3>
                <p class="text-sm text-gray-400 mt-2 max-w-md">No pudimos sincronizar el inventario. Verifica tu conexión o recarga la página.</p>
            </div>`;
    }
}

function obtenerUrlFotoLocal(fotoPath) {
    if (!fotoPath) return 'https://placehold.co/400x300?text=Sin+Foto';
    if (fotoPath.startsWith('http')) return fotoPath;
    const baseStorage = (typeof window.CONFIG_DB !== 'undefined') ? 
        `${window.CONFIG_DB.SUPABASE_URL}/storage/v1/object/public/autos/` : 
        "https://zamiahmbgwqiralxinju.supabase.co/storage/v1/object/public/autos/";
    return baseStorage + fotoPath;
}

// ==========================================
// FILTROS INTELIGENTES
// ==========================================
function toggleFilters() { 
    document.getElementById('filter-drawer').classList.toggle('open'); 
}

function setCategoria(cat, btnElement) {
    categoriaActual = cat;
    
    document.querySelectorAll('.quick-cat').forEach(b => {
        b.classList.remove('active', 'bg-black', 'text-white');
        if(b.innerText.toLowerCase() === cat.toLowerCase() || (cat === 'Todas' && b.innerText.toLowerCase() === 'todos')) {
            b.classList.add('active', 'bg-black', 'text-white');
        }
    });

    document.querySelectorAll('.drawer-cat').forEach(b => {
        b.classList.remove('active');
        if(b === btnElement || b.innerText.toLowerCase().includes(cat.toLowerCase())) {
            b.classList.add('active');
        }
    });

    filtrarTodo();
}

function aplicarFiltrosDrawer() {
    filtrarTodo();
    toggleFilters(); 
}

function resetFiltros() { 
    document.getElementById('buscador').value = ""; 
    document.getElementById('min-year').value = "0"; 
    document.getElementById('max-year').value = "3000"; 
    document.getElementById('transmision').value = "Todas";
    
    setCategoria('Todas', document.querySelector('.drawer-cat'));
}

function filtrarTodo() {
    const busqueda = document.getElementById('buscador').value.toLowerCase();
    const minAnio = parseInt(document.getElementById('min-year').value) || 0;
    const maxAnio = parseInt(document.getElementById('max-year').value) || 3000;
    const trans = document.getElementById('transmision').value;

    const resultados = inventarioMaster.filter(auto => {
        const marcaModelo = `${auto.marca || ''} ${auto.modelo || ''}`.toLowerCase();
        const matchBusqueda = marcaModelo.includes(busqueda);
        const anio = parseInt(auto.anio) || 0;
        const matchAnio = anio >= minAnio && anio <= maxAnio;
        const matchTrans = trans === 'Todas' || (auto.transmision && auto.transmision === trans);
        const matchCat = categoriaActual === 'Todas' || (auto.tipo && auto.tipo === categoriaActual);
        
        return matchBusqueda && matchAnio && matchTrans && matchCat;
    });

    renderGrid(resultados);
}

// ==========================================
// RENDERIZADO (UI)
// ==========================================
function renderGrid(datos) {
    const grid = document.getElementById('inventory-grid');
    
    if(!datos || datos.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-24 text-center">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl text-gray-300 mb-4"><i class="fa-solid fa-car-tunnel"></i></div>
                <h3 class="font-title font-black uppercase italic text-2xl text-gray-400">Sin coincidencias</h3>
                <p class="text-sm text-gray-400 mt-2 font-medium">Intenta ajustar los filtros o el rango de años.</p>
                <button onclick="resetFiltros()" class="mt-6 text-[#ff8801] font-bold text-xs uppercase tracking-widest hover:underline">Limpiar Filtros</button>
            </div>`;
        return;
    }

    grid.innerHTML = datos.map(carro => {
        const inCart = carrito.some(i => i.id === carro.id);
        const tieneVariasFotos = carro.fotos && carro.fotos.length > 0;
        const indexActual = fotoIndices[carro.id] || 0;

        let fotoUrl = 'https://placehold.co/400x300?text=Sin+Foto';
        if (tieneVariasFotos) {
            fotoUrl = obtenerUrlFotoLocal(carro.fotos[indexActual]);
        } else if (carro.foto) {
            fotoUrl = obtenerUrlFotoLocal(carro.foto);
        }

        return `
        <div class="car-card group flex flex-col justify-between">
            <div class="relative m-2 aspect-[4/3] rounded-[24px] overflow-hidden bg-gray-100 cursor-pointer" onclick="window.location.href='detalle.html?id=${carro.id}'">
                <img id="img-${carro.id}" src="${fotoUrl}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                ${tieneVariasFotos && carro.fotos.length > 1 ? `
                    <div class="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onclick="cambiarFoto('${carro.id}', -1, event)" class="nav-btn"><i class="fa-solid fa-chevron-left text-sm"></i></button>
                        <button onclick="cambiarFoto('${carro.id}', 1, event)" class="nav-btn"><i class="fa-solid fa-chevron-right text-sm"></i></button>
                    </div>
                    <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                        ${carro.fotos.map((_, i) => `<div class="w-1.5 h-1.5 rounded-full ${i === indexActual ? 'bg-white' : 'bg-white/50'}"></div>`).join('')}
                    </div>
                ` : ''}
                
                <!-- IMPORTANTE: se añadió 'btn-add-cart' a la clase para el selector del tutorial -->
                <button onclick="toggleSeleccion('${carro.id}', event)" class="btn-add-cart absolute top-3 right-3 z-20 w-11 h-11 flex items-center justify-center rounded-2xl backdrop-blur-md shadow-xl transition-all ${inCart ? 'bg-[#ff8801] text-black scale-105' : 'bg-white/90 text-black hover:bg-black hover:text-white'}">
                    <i class="fa-solid ${inCart ? 'fa-check' : 'fa-plus'} text-lg"></i>
                </button>
            </div>

            <div class="p-5 pt-3 flex flex-col flex-1" onclick="window.location.href='detalle.html?id=${carro.id}'">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-black text-xl uppercase italic leading-tight text-gray-900 truncate pr-2">${carro.marca} <span class="text-[#ff8801]">${carro.modelo}</span></h3>
                </div>
                
                <div class="flex flex-wrap gap-2 mb-4">
                    <span class="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-200">${carro.anio}</span>
                    <span class="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-200">${carro.transmision || 'S/D'}</span>
                    <span class="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-200">${(carro.kilometraje || 0).toLocaleString()} KM</span>
                </div>
                
                <div class="mt-auto border-t border-gray-100 pt-3 flex justify-between items-center">
                    <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Valor Estimado</span>
                    <div class="text-black font-black text-2xl tracking-tighter">${currency.format(carro.precio_venta || 0)}</div>
                </div>
            </div>
        </div>`;
    }).join('');
    actualizarPanelCarrito();
}

function cambiarFoto(id, direccion, event) {
    event.stopPropagation();
    const carro = inventarioMaster.find(c => c.id === id);
    if(!carro || !carro.fotos) return;

    const max = carro.fotos.length;
    fotoIndices[id] = (fotoIndices[id] + direccion + max) % max;
    
    renderGrid(inventarioMaster.filter(auto => document.getElementById(`img-${auto.id}`))); 
    filtrarTodo(); 
}

// ==========================================
// CARRITO Y CHECKOUT
// ==========================================
function toggleSeleccion(id, event) {
    if(event) event.stopPropagation();
    const carro = inventarioMaster.find(c => c.id === id);
    const idx = carrito.findIndex(c => c.id === id);
    
    idx > -1 ? carrito.splice(idx, 1) : carrito.push(carro);
    sessionStorage.setItem("carrito_multiamerica", JSON.stringify(carrito));
    
    actualizarPanelCarrito();
    filtrarTodo(); 
}

function abrirChatConSeleccion() {
    if (carrito.length === 0) return alert("Selecciona al menos un vehículo para consultar.");
    sessionStorage.setItem('carrito_multiamerica', JSON.stringify(carrito));
    window.location.href = 'chatia.html?cart=true';
}

function irAlCheckout() {
    if (carrito.length === 0) return alert("Selecciona al menos un vehículo para agendar.");
    sessionStorage.setItem("carrito_multiamerica", JSON.stringify(carrito));
    window.location.href = 'checkout.html';
}

function actualizarPanelCarrito() {
    const panel = document.getElementById('cart-panel');
    const contador = document.getElementById('cart-count');
    
    if (carrito.length > 0) { 
        panel.classList.add('active'); 
        contador.innerText = `${carrito.length} Vehículo${carrito.length !== 1 ? 's' : ''}`;
        
        contador.parentElement.parentElement.firstElementChild.classList.add('animate-bounce');
        setTimeout(() => contador.parentElement.parentElement.firstElementChild.classList.remove('animate-bounce'), 1000);
    } else { 
        panel.classList.remove('active'); 
    }
}

// ==========================================
// ATRIBUCIÓN (VENDEDOR)
// ==========================================
async function inicializarAtribucion() {
    const params = new URLSearchParams(window.location.search);
    const vSlug = params.get('v');
    if (vSlug) {
        try {
            const client = (typeof _supabase !== 'undefined') ? _supabase : supabase;
            const { data } = await client.from('vendedores').select('whatsapp, nombre').eq('slug', vSlug).eq('activo', true).single();
            if (data) {
                localStorage.setItem("ws_vendedor", data.whatsapp);
                localStorage.setItem("nombre_vendedor", data.nombre);
            }
        } catch(e) {}
    }
}

// ==========================================
// LÓGICA DEL TUTORIAL
// ==========================================
let indicePaso = 0;
const pasosTutorial = [
    { id: 'buscador-container', texto: "🕵️‍♂️ Escribe aquí la nave que buscas. El inventario se filtrará automáticamente.", audio: 'paso1.mp3' },
    { id: 'btn-filtros', texto: "⚙️ Usa los filtros avanzados para buscar por años específicos o transmisiones.", audio: 'paso2.mp3' },
    { selector: '.btn-add-cart', texto: "➕ Haz clic en el botón naranja para añadir vehículos a tu garaje personal.", audio: 'paso3.mp3' },
    { id: 'cart-panel', texto: "📅 Cuando termines tu selección, dale a 'Agendar' para que un gerente te atienda.", audio: 'paso4.mp3' }
];

function iniciarTutorial() {
    indicePaso = 0;
    document.getElementById('tutorial-overlay').style.display = 'block';
    mostrarPasoActual();
}

function mostrarPasoActual() {
    const config = pasosTutorial[indicePaso];
    const bubble = document.getElementById('tutorial-bubble');
    const text = document.getElementById('tutorial-text');
    const audio = document.getElementById('guia-audio');

    // Limpiar resaltado anterior
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));

    const target = config.id ? document.getElementById(config.id) : document.querySelector(config.selector);

    if (target && bubble) {
        target.classList.add('tutorial-highlight');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Reproducir Audio
        if(audio) {
            audio.src = `./audio/${config.audio}`;
            audio.play().catch(e => console.log("Interacción requerida para audio"));
        }

        bubble.style.display = 'block';
        const rect = target.getBoundingClientRect();
        
        // Posicionamiento inteligente del globo
        let topPos = rect.bottom + window.scrollY + 20;
        if (topPos + 200 > document.body.scrollHeight) topPos = rect.top + window.scrollY - 220;

        bubble.style.top = `${topPos}px`;
        bubble.style.left = `${Math.max(20, Math.min(rect.left, window.innerWidth - 300))}px`;
        text.innerText = config.texto;
    } else {
        // Si el elemento no existe en pantalla (ej. carrito vacío), saltar
        siguientePaso();
    }
}

function siguientePaso() {
    indicePaso++;
    if (indicePaso < pasosTutorial.length) {
        mostrarPasoActual();
    } else {
        cerrarTutorial();
    }
}

function cerrarTutorial() {
    document.getElementById('tutorial-overlay').style.display = 'none';
    document.getElementById('tutorial-bubble').style.display = 'none';
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    
    const audio = document.getElementById('guia-audio');
    if (audio) audio.pause();
}