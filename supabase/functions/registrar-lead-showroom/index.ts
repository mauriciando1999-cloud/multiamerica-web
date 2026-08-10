import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tipo, cliente_nombre, cliente_telefono, vehiculos, gerente_slug, fecha_hora, ubicacion } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscamos al gerente asignado server-side. Su email nunca se
    // expone al navegador del cliente (la web publica solo conoce
    // el slug/whatsapp via la vista publica lista_gerentes).
    let gerente: { nombre: string; apellido: string | null; email: string | null } | null = null
    if (gerente_slug) {
      const { data } = await supabase
        .from('vendedores')
        .select('nombre, apellido, email')
        .eq('slug', gerente_slug)
        .maybeSingle()
      gerente = data
    }

    const gerenteNombreCompleto = gerente ? `${gerente.nombre} ${gerente.apellido || ''}`.trim() : null

    const { error: dbError } = await supabase.from('consultas_showroom').insert([{
      tipo: tipo || 'Consulta',
      cliente_nombre: cliente_nombre || null,
      cliente_telefono: cliente_telefono || null,
      vehiculos: vehiculos || [],
      gerente_slug: gerente_slug || null,
      gerente_nombre: gerenteNombreCompleto,
      gerente_email: gerente?.email || null,
      fecha_hora: fecha_hora || null,
      ubicacion: ubicacion || null
    }])

    if (dbError) throw dbError

    // Si tenemos email del gerente, le avisamos por correo (no hay
    // integracion de WhatsApp Business API en el proyecto).
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

        const listaAutos = (vehiculos || []).map((v: string) => `- ${v}`).join('\n')
        const asunto = tipo === 'Cita'
          ? `Nueva cita agendada: ${cliente_nombre || 'Cliente'}`
          : `Nuevo lead del Showroom: ${cliente_nombre || 'Cliente'}`

        await client.send({
          from: `Multiamerica <${GMAIL_USER}>`,
          to: gerente.email,
          subject: asunto,
          content: "text/html",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              <h2 style="color: #ea580c;">¡Hola, ${gerente.nombre}!</h2>
              <p>Se te asignó un ${tipo === 'Cita' ? 'cliente con cita agendada' : 'cliente interesado'} en el Showroom.</p>
              <div style="background:#fff7ed; border-left:4px solid #ea580c; padding:20px; margin:20px 0; border-radius:8px;">
                ${cliente_nombre ? `<p><strong>Cliente:</strong> ${cliente_nombre}</p>` : ''}
                ${cliente_telefono ? `<p><strong>Teléfono:</strong> ${cliente_telefono}</p>` : ''}
                ${fecha_hora ? `<p><strong>Fecha/Hora:</strong> ${fecha_hora}</p>` : ''}
                ${ubicacion ? `<p><strong>Ubicación:</strong> ${ubicacion}</p>` : ''}
                <p><strong>Vehículos:</strong></p>
                <pre style="white-space:pre-wrap; font-family:inherit;">${listaAutos}</pre>
              </div>
              <p style="font-size:13px; color:#777;">Contactalo lo antes posible desde el panel de Leads en Multiapp.</p>
            </div>`,
        })

        await client.close()
      } catch (mailErr) {
        // No bloqueamos el registro del lead si falla el correo.
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
