import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Los datos del formulario vienen de un visitante anonimo sin validar:
// hay que escaparlos antes de meterlos en el HTML del correo.
function escapeHtml(str: unknown): string {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c] as string))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nombre, telefono, vehiculo, anio, kilometraje, precio, fotos, gerente_slug } = await req.json()

    if (!nombre || !telefono || !vehiculo) {
      return new Response(JSON.stringify({ error: 'Faltan datos obligatorios.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscamos al gerente asignado server-side. Su email nunca se expone
    // al navegador del cliente (la web publica solo conoce el
    // slug/whatsapp via la vista publica lista_gerentes).
    let gerente: { nombre: string; apellido: string | null; email: string | null; slug: string } | null = null
    if (gerente_slug) {
      const { data } = await supabase
        .from('vendedores')
        .select('nombre, apellido, email, slug')
        .eq('slug', gerente_slug)
        .maybeSingle()
      gerente = data
    }

    const gerenteNombreCompleto = gerente ? `${gerente.nombre} ${gerente.apellido || ''}`.trim() : 'Asesor Élite'

    const { error: dbError } = await supabase.from('consignaciones').insert([{
      nombre,
      telefono,
      vehiculo,
      anio: parseInt(anio) || null,
      kilometraje: parseInt(kilometraje) || null,
      precio: parseInt(precio) || null,
      fotos: Array.isArray(fotos) ? fotos : [],
      estatus: 'Pendiente de Revisión',
      gerente_nombre: gerenteNombreCompleto,
      gerente_slug: gerente?.slug || null,
      gerente_email: gerente?.email || null,
    }])

    if (dbError) throw dbError

    // La notificacion push al gerente la dispara el trigger de la tabla
    // (notif_consignacion_trigger). Aca solo mandamos el correo como
    // canal redundante, igual que en registrar-lead-showroom.
    if (gerente?.email) {
      try {
        const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? ''
        const GMAIL_PASS = Deno.env.get('GMAIL_PASS') ?? ''

        const client = new SMTPClient({
          connection: {
            hostname: "smtp.gmail.com",
            port: 465,
            tls: true,
            auth: { username: GMAIL_USER, password: GMAIL_PASS },
          },
        })

        const nombreSafe = escapeHtml(nombre)
        const vehiculoSafe = escapeHtml(vehiculo)

        await client.send({
          from: `Multiamerica Vehículos <${GMAIL_USER}>`,
          to: gerente.email,
          subject: `Nueva consignación: ${vehiculoSafe}`,
          content: "text/html",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              <h2 style="color: #d65127;">¡Hola, ${escapeHtml(gerente.nombre)}!</h2>
              <p>Un cliente quiere consignar su vehículo y te fue asignado.</p>
              <div style="background:#fdf1ec; border-left:4px solid #d65127; padding:20px; margin:20px 0; border-radius:8px;">
                <p><strong>Cliente:</strong> ${nombreSafe}</p>
                <p><strong>Teléfono:</strong> ${escapeHtml(telefono)}</p>
                <p><strong>Vehículo:</strong> ${vehiculoSafe} ${anio ? `(${escapeHtml(anio)})` : ''}</p>
                ${kilometraje ? `<p><strong>Kilometraje:</strong> ${escapeHtml(kilometraje)} km</p>` : ''}
                ${precio ? `<p><strong>Precio deseado:</strong> $${escapeHtml(precio)}</p>` : ''}
              </div>
              <p style="font-size:13px; color:#777;">Revisalo desde el panel de Revisiones en Multiapp.</p>
            </div>`,
        })

        await client.close()
      } catch (mailErr) {
        console.error("Error enviando notificación al gerente:", mailErr)
      }
    }

    return new Response(JSON.stringify({ success: true, gerente: gerenteNombreCompleto }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
