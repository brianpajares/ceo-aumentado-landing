
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, nombre, email, pais, empresa, telefono, mensaje, consentimiento, metadata } = req.body;

  // 1. CONFIGURACIÓN
  const RESEND_API_KEY = 're_M6Rb1RA4_8GQGFv6bmW9x3BQQpTnU3nfb';
  const DRIVE_LINK = 'https://drive.google.com/file/d/1GTsGTPQChHbyYxTOacs5BGbBGMmldZB2/view?usp=drive_link';
  const OWNER_EMAIL = 'zonedigital89@gmail.com';
  
  const SUPABASE_URL = 'https://guwmnpmyeynoywuhmyrd.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_gFWidTjbgCkuOpvAgF0cgg_x2Lgguu1';

  try {
    // --- CASO A: CAPÍTULO GRATIS (LEAD) ---
    if (type === 'lead') {
      // Guardar en Supabase
      await fetch(`${SUPABASE_URL}/rest/v1/leads_ceo_aumentado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          nombre, email, pais, consentimiento,
          utm_source: metadata.utm_source,
          utm_medium: metadata.utm_medium,
          utm_campaign: metadata.utm_campaign,
          referrer: metadata.referrer,
          landing_url: metadata.landing_url,
          user_agent: metadata.user_agent
        })
      });

      // Enviar email al lector
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'CEO Aumentado <onboarding@resend.dev>',
          to: [email],
          subject: '🚀 Tu capítulo gratis de CEO Aumentado',
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>¡Hola ${nombre}!</h2>
              <p>Aquí tienes el acceso al primer capítulo de <strong>CEO Aumentado</strong>:</p>
              <p><a href="${DRIVE_LINK}" style="background: #e9b949; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Descargar PDF →</a></p>
            </div>
          `
        })
      });

      // Notificar al dueño
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Sistema <onboarding@resend.dev>',
          to: [OWNER_EMAIL],
          subject: '🔔 Nuevo Lead - Capítulo Gratis',
          html: `<p><strong>Nombre:</strong> ${nombre}<br><strong>Email:</strong> ${email}<br><strong>País:</strong> ${pais}</p>`
        })
      });
    }

    // --- CASO B: CONTACTO DIRECTO ---
    if (type === 'contact') {
      // Guardar en Supabase
      await fetch(`${SUPABASE_URL}/rest/v1/contacts_ceo_aumentado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          nombre, email, empresa, telefono, mensaje,
          utm_source: metadata.utm_source,
          utm_medium: metadata.utm_medium,
          utm_campaign: metadata.utm_campaign,
          referrer: metadata.referrer
        })
      });

      // Notificar al dueño con el mensaje
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Contacto Web <onboarding@resend.dev>',
          to: [OWNER_EMAIL],
          subject: `📩 Nuevo Mensaje de ${nombre}`,
          html: `
            <h3>Nuevo mensaje de contacto:</h3>
            <p><strong>Nombre:</strong> ${nombre}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Empresa:</strong> ${empresa || 'N/A'}</p>
            <p><strong>Teléfono:</strong> ${telefono || 'N/A'}</p>
            <p><strong>Mensaje:</strong></p>
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #e9b949;">${mensaje}</div>
          `
        })
      });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
