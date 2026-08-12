// public-db.js
// public-db.js
var CONFIG = {
    SUPABASE_URL: 'https://zamiahmbgwqiralxinju.supabase.co',
    SUPABASE_KEY: 'sb_publishable_GF4Xma460bOVv9WT64Q-cA_r-0DUHHX',
    NUMERO_PROPIETARIO: "584123768312", 
    COLOR_PRIMARIO: "#d65127", 
    NOMBRE_EMPRESA: "Multiamerica Vehiculos"
};

// Esto permite que el nuevo código la encuentre como CONFIG_DB
window.CONFIG_DB = CONFIG;

// Tu código existente de supabase no cambia
const _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
async function obtenerInventarioPublico() {
    try {
        console.log("Iniciando conexión con Supabase...");
        
        const { data, error } = await _supabase
            .from('inventario')
            .select(`
                id, 
                marca, 
                modelo, 
                anio, 
                precio_venta, 
                kilometraje, 
                transmision, 
                fotos,
                descripcion,
                estatus
            `)
            // Importante: Asegúrate de que esta columna exista en Supabase o coméntala
            // .eq('publicado_web', true) 
            .neq('estatus', 'Vendido') // Solo traemos lo que NO está vendido
            .order('creado_el', { ascending: false }); // Corregido: 'creado_el' según tus fotos

        if (error) {
            console.error("Error de Supabase:", error.message);
            throw error;
        }

        // Mapeo automático de URLs de Storage para las fotos
        const inventarioConUrls = data.map(carro => {
            if (carro.fotos && Array.isArray(carro.fotos)) {
                carro.fotos = carro.fotos.map(foto => {
                    if (foto.startsWith('http')) return foto;
                    const { data: urlData } = _supabase.storage.from('autos').getPublicUrl(foto);
                    return urlData.publicUrl;
                });
            }
            return carro;
        });

        console.log("Inventario cargado exitosamente:", inventarioConUrls.length, "unidades.");
        return inventarioConUrls;

    } catch (err) {
        console.error("Fallo crítico en obtenerInventarioPublico:", err.message);
        return [];
    }
}