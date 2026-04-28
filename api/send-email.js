
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, nombre, email, pais, empresa, telefono, mensaje, consentimiento, metadata } = req.body;

  const RESEND_API_KEY = 're_M6Rb1RA4_8GQGFv6bmW9x3BQQpTnU3nfb';
  const DRIVE_LINK = 'https://drive.google.com/file/d/1GTsGTPQChHbyYxTOacs5BGbBGMmldZB2/view?usp=drive_link';
  const OWNER_EMAIL = 'zonedigital89@gmail.com';
  
  const SUPABASE_URL = 'https://guwmnpmyeynoywuhmyrd.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_gFWidTjbgCkuOpvAgF0cgg_x2Lgguu1';

  try {
    console.log(`Procesando envío de tipo: ${type} para ${email}`);

    // --- 1. GUARDAR EN SUPABASE ---
    const table = type === 'lead' ? 'leads_ceo_aumentado' : 'contacts_ceo_aumentado';
    const body = type === 'lead' ? {
      nombre, email, pais, consentimiento,
      utm_source: metadata.utm_source,
      utm_medium: metadata.utm_medium,
      utm_campaign: metadata.utm_campaign,
      referrer: metadata.referrer,
      landing_url: metadata.landing_url,
      user_agent: metadata.user_agent
    } : {
      nombre, email, empresa, telefono, mensaje,
      utm_source: metadata.utm_source,
      utm_medium: metadata.utm_medium,
      utm_campaign: metadata.utm_campaign,
      referrer: metadata.referrer
    };

    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(body)
    });

    if (!dbRes.ok) {
      const dbErr = await dbRes.text();
      console.error('Error Supabase:', dbErr);
    }

    // --- 2. ENVIAR EMAILS VÍA RESEND ---
    const emailsToSend = [];

    if (type === 'lead') {
      emailsToSend.push({
        from: 'CEO Aumentado <onboarding@resend.dev>',
        to: [email],
        subject: '🚀 Tu capítulo gratis de CEO Aumentado',
        html: `<div style="font-family:sans-serif"><h2>¡Hola ${nombre}!</h2><p>Aquí tienes el acceso al primer capítulo:</p><p><a href="${DRIVE_LINK}" style="background:#e9b949;color:#000;padding:10px 20px;text-decoration:none;border-radius:5px">Descargar PDF →</a></p></div>`
      });
    }

    // Notificación siempre al dueño
    emailsToSend.push({
      from: 'Sistema <onboarding@resend.dev>',
      to: [OWNER_EMAIL],
      subject: type === 'lead' ? '🔔 Nuevo Lead - Capítulo' : `📩 Nuevo Mensaje de ${nombre}`,
      html: `<p><strong>Nombre:</strong> ${nombre}<br><strong>Email:</strong> ${email}</p>${mensaje ? `<p><strong>Mensaje:</strong> ${mensaje}</p>` : ''}`
    });

    // Enviar todos los correos y capturar errores de Resend
    for (const mail of emailsToSend) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify(mail)
      });

      if (!resendRes.ok) {
        const resendErr = await resendRes.json();
        console.error('Error de Resend:', resendErr);
        // Si falla el envío al lector por restricción de onboarding, al menos intentamos que te llegue a ti
        if (mail.to[0] !== OWNER_EMAIL) continue; 
        throw new Error(`Resend error: ${JSON.stringify(resendErr)}`);
      }
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error crítico:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
