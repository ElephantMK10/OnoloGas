// Netlify Function to send emails via Resend using fetch (no SDK)
// Requires RESEND_API_KEY to be set in Netlify env
exports.handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { emailData } = JSON.parse(event.body);

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'RESEND_API_KEY not configured' }) };
    }

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Onolo Gas <orders@orders-onologroup.online>',
        to: [emailData.customerEmail],
        subject: emailData.subject,
        html: emailData.html,
      }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      let err;
      try { err = JSON.parse(text); } catch { err = { error: text }; }
      return { statusCode: 400, headers, body: JSON.stringify(err) };
    }

    return { statusCode: 200, headers, body: text };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 