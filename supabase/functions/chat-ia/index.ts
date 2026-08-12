import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json();
    const mensajes = body.mensajes || [];
    const contexto = body.contexto || []; 
    const inventarioTotal = body.inventario || []; 

    // OBTENER LAS DOS CLAVES DESDE SUPABASE SECRETS
    const keys = [
      Deno.env.get('GEMINI_API_KEY_1'),
      Deno.env.get('GEMINI_API_KEY_2')
    ].filter(Boolean); // Esto elimina las claves vacías si olvidaste configurar alguna

    if (keys.length === 0) throw new Error("API Keys no configuradas en Supabase.");

    const infoShowroom = Array.isArray(contexto) && contexto.length > 0 
      ? contexto.map((c: any) => `- ${c.marca} ${c.modelo} ${c.anio} (${c.kilometraje}km) | Color: ${c.color} | Transmisión: ${c.transmision} | Precio: $${c.precio_venta}`).join("\n")
      : "Ningún vehículo en el carrito.";

    const infoCatalogo = Array.isArray(inventarioTotal) && inventarioTotal.length > 0
      ? inventarioTotal.map((c: any) => `- ${c.marca} ${c.modelo} ${c.anio} - $${c.precio_venta}`).join("\n")
      : "Inventario no disponible.";

    let contents = mensajes.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    if (contents.length > 0 && contents[0].role === 'model') {
        contents.unshift({ role: 'user', parts: [{ text: 'Hola.' }] });
    }

    const promptVentas = `Eres un "Closer" de ventas de élite en Multiamerica Vehículos, ubicado en Caracas (Chevrolet de Quinta Crespo). Tu objetivo es perfilar al cliente, generar confianza y guiarlo hacia una cita.

REGLAS DE ORO:
1. TONO: Humano, persuasivo, directo. Como un asesor por WhatsApp. 
2. PRUEBAS DE MANEJO: No se hacen pruebas antes de pagar. El carro se puede probar una vez pagado en su totalidad. Si algo sale raro en la prueba, devolvemos el dinero. Esto es porque antes nos chocaron o rayaron carros al probarlos.
3. CONSIGNACIÓN: Respetamos tu precio y solo agregamos un 5% de comisión. Tenemos más de 60 personas haciendo publicidad a tu vehículo, lo que aumenta las chances de venta en un 1000%. El carro queda exhibido en nuestras instalaciones seguras.
4. HORARIOS (ESTRICTO): Solo atendemos Lunes a Viernes de 9:00am a 5:00pm, y Sábados de 9:00am a 2:00pm. Cerrado los Domingos. NUNCA confirmes, sugieras ni aceptes una cita fuera de este horario (ni domingos, ni antes/después de la hora de cierre del día). Si el cliente propone un día u hora fuera de rango, dile amablemente que en ese horario no hay atención y ofrécele la opción disponible más cercana dentro del horario.
5. CITA / AGENDAR: Si el cliente muestra interés real en un auto, invítalo a visitarnos para verlo y prenderlo, siempre dentro del horario de atención. Dile: "Para que sientas el carro y lo veas en persona, ¿te parece bien si agendamos una visita?". No fijes tú mismo la fecha y hora exacta: el cliente la elige en el siguiente paso (el botón de agendar); tu rol es solo invitarlo a agendar.
6. PRECIOS: Se pueden negociar ofertas, pero únicamente en el concesionario tras ver el vehículo.

AUTOS QUE EL CLIENTE ESTÁ CONSULTANDO:
${infoShowroom}

NUESTRO INVENTARIO COMPLETO:
${infoCatalogo}

RESTRICCIÓN: NUNCA menciones que eres IA. NUNCA inventes precios.NO ofrezcas la cita en el primer mensaje, constrúyelo naturalmente.`;

    let respuestaExitosa = null;
    let ultimoError = null;

    // BUCLE DE REDUNDANCIA: Intenta la Clave 1, si falla, intenta la Clave 2.
    for (const apiKey of keys) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: { parts: [{ text: promptVentas }] }
          }),
        });

        const result = await response.json();
        
        if (!response.ok || !result.candidates) {
          throw new Error(result.error?.message || "Error en la red de Gemini");
        }

        // Si llegamos aquí, la clave funcionó perfectamente
        respuestaExitosa = result.candidates[0].content.parts[0].text;
        break; // Rompemos el bucle, ya no necesitamos probar la segunda clave

      } catch (error: any) {
        console.warn(`Fallo con una API Key, intentando con la siguiente... Error: ${error.message}`);
        ultimoError = error;
      }
    }

    // Si después de intentar con todas las claves no hay respuesta, lanzamos el error al frontend
    if (!respuestaExitosa) {
      throw new Error("HIGH_DEMAND"); // Etiqueta personalizada para el frontend
    }

    return new Response(JSON.stringify({ respuesta: respuestaExitosa }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})