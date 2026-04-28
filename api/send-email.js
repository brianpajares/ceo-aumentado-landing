
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, nombre, email, pais, empresa, telefono, mensaje, consentimiento, metadata } = req.body;

  const RESEND_API_KEY = 're_M6Rb1RA4_8GQGFv6bmW9x3BQQpTnU3nfb';
  const OWNER_EMAIL = 'zonedigital89@gmail.com';
  
  const SUPABASE_URL = 'https://guwmnpmyeynoywuhmyrd.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_gFWidTjbgCkuOpvAgF0cgg_x2Lgguu1';

  try {
    // --- 1. GUARDAR EN SUPABASE ---
    const table = type === 'lead' ? 'leads_ceo_aumentado' : 'contacts_ceo_aumentado';
    const body = type === 'lead' ? {
      nombre, email, pais, consentimiento,
      utm_source: metadata?.utm_source,
      utm_medium: metadata?.utm_medium,
      utm_campaign: metadata?.utm_campaign,
      referrer: metadata?.referrer,
      landing_url: metadata?.landing_url,
      user_agent: metadata?.user_agent
    } : {
      nombre, email, empresa, telefono, mensaje,
      utm_source: metadata?.utm_source,
      utm_medium: metadata?.utm_medium,
      utm_campaign: metadata?.utm_campaign,
      referrer: metadata?.referrer
    };

    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(body)
    });

    // --- 2. NOTIFICACIÓN AL DUEÑO VÍA RESEND ---
    // Resend permite usar onboarding@resend.dev SOLO para enviarte correos a ti mismo.
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Sistema Web <onboarding@resend.dev>',
        to: [OWNER_EMAIL],
        subject: type === 'lead' ? '🔔 Nuevo Lead - Capítulo' : `📩 Nuevo Mensaje de ${nombre}`,
        html: `<p><strong>Nombre:</strong> ${nombre}<br><strong>Email:</strong> ${email}</p>${mensaje ? `<p><strong>Mensaje:</strong> ${mensaje}</p>` : ''}`
      })
    });

    if (!resendRes.ok) {
        console.error("Resend error:", await resendRes.text());
        // No lanzamos error para que al menos el usuario vea el PDF en pantalla,
        // aunque falle el envío del correo al dueño.
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error crítico:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
