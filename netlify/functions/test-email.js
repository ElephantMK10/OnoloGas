const { Resend } = require('resend');

// Test the API key directly
const resend = new Resend('re_ZKquAjEF_L8WJyLRbHr9JnM9nKJ95A2E5');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Test the API key by trying to send a simple email
    const { data, error } = await resend.emails.send({
      from: 'Onolo Gas <orders@orders-onologroup.online>',
      to: ['test@example.com'],
      subject: 'Test Email - API Key Working',
      html: '<p>This is a test email to verify the API key is working.</p>',
    });

    if (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: error.message,
          apiKeyUsed: 're_ZKquAjEF_L8WJyLRbHr9JnM9nKJ95A2E5'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'API key is working!',
        data: data
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        apiKeyUsed: 're_ZKquAjEF_L8WJyLRbHr9JnM9nKJ95A2E5'
      })
    };
  }
}; 