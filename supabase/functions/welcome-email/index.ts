// Supabase Edge Function for sending welcome emails via Resend
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface WelcomeEmailRequest {
  email: string;
  firstName: string;
  lastName?: string;
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

console.log("Welcome Email Function initialized");

Deno.serve(async (req) => {
  // CORS headers for all responses
  const origin = req.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:8081',
    'https://orders-onologroup.online',
    'https://orders-onologroup.netlify.app',
    'https://manager-onologroup.online',
    'https://manager-onologroup.netlify.app'
  ];

  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin || '') ? origin : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Check if Resend API key is configured
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Parse request body
    const { email, firstName, lastName }: WelcomeEmailRequest = await req.json();

    // Validate required fields
    if (!email || !firstName) {
      return new Response(
        JSON.stringify({ error: 'Email and firstName are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Sending welcome email to: ${email} (${firstName} ${lastName || ''})`);

    // Generate welcome email HTML
    const welcomeEmailHtml = generateWelcomeEmailHtml(firstName, lastName, email);

    // Send email via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Onolo Gas <orders@orders-onologroup.online>',
        to: [email],
        subject: '🔥 Welcome to Onolo Gas - Your Gas Delivery Service!',
        html: welcomeEmailHtml,
      })
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Resend API error:', emailResult);
      return new Response(
        JSON.stringify({
          error: 'Failed to send welcome email',
          details: emailResult
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    console.log('Welcome email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome email sent successfully',
        emailId: emailResult.id
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Error in welcome-email function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});

/**
 * Generate professional welcome email HTML template
 * Matches the existing Onolo Gas branding and email design
 */
function generateWelcomeEmailHtml(firstName: string, lastName?: string, email?: string): string {
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Onolo Gas</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #f8f9fa;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            margin: 20px;
          }
          .header {
            background: linear-gradient(135deg, #FF6B00 0%, #FF8533 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header .subtitle {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            padding: 40px 30px;
          }
          .welcome-message {
            background-color: #fff8f0;
            border-left: 4px solid #FF6B00;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .welcome-message h2 {
            color: #FF6B00;
            margin: 0 0 10px 0;
            font-size: 22px;
          }
          .features {
            margin: 30px 0;
          }
          .feature {
            display: flex;
            align-items: flex-start;
            margin: 15px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }
          .feature-icon {
            background-color: #FF6B00;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-weight: bold;
            flex-shrink: 0;
          }
          .feature-content h3 {
            margin: 0 0 5px 0;
            color: #333;
            font-size: 16px;
          }
          .feature-content p {
            margin: 0;
            color: #666;
            font-size: 14px;
          }
          .cta-section {
            text-align: center;
            margin: 30px 0;
            padding: 30px;
            background: linear-gradient(135deg, #fff8f0 0%, #fff 100%);
            border-radius: 12px;
            border: 2px solid #FF6B00;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #FF6B00 0%, #FF8533 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin: 10px 0;
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .contact-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .contact-info h3 {
            color: #FF6B00;
            margin: 0 0 10px 0;
          }
          .contact-info p {
            margin: 5px 0;
            color: #666;
          }
          .spam-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .spam-notice strong {
            color: #856404;
          }
          .footer {
            background-color: #2c3e50;
            color: #ecf0f1;
            text-align: center;
            padding: 30px;
            font-size: 14px;
          }
          .footer p {
            margin: 5px 0;
          }
          .social-links {
            margin: 15px 0;
          }
          .social-links a {
            color: #FF6B00;
            text-decoration: none;
            margin: 0 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔥 Welcome to Onolo Gas!</h1>
            <p class="subtitle">Your trusted gas delivery service</p>
          </div>

          <div class="content">
            <div class="welcome-message">
              <h2>Hello ${fullName}! 👋</h2>
              <p>Thank you for joining Onolo Gas! We're excited to have you as part of our family and look forward to providing you with reliable, convenient gas delivery services.</p>
            </div>

            <p>With Onolo Gas, you can now enjoy:</p>

            <div class="features">
              <div class="feature">
                <div class="feature-icon">🚚</div>
                <div class="feature-content">
                  <h3>Fast & Reliable Delivery</h3>
                  <p>Get your gas delivered right to your doorstep with our efficient delivery network.</p>
                </div>
              </div>

              <div class="feature">
                <div class="feature-icon">📱</div>
                <div class="feature-content">
                  <h3>Easy Mobile Ordering</h3>
                  <p>Order gas anytime, anywhere with our user-friendly mobile app and website.</p>
                </div>
              </div>

              <div class="feature">
                <div class="feature-icon">💳</div>
                <div class="feature-content">
                  <h3>Secure Payment Options</h3>
                  <p>Pay safely with multiple payment methods including card payments and digital wallets.</p>
                </div>
              </div>

              <div class="feature">
                <div class="feature-icon">⭐</div>
                <div class="feature-content">
                  <h3>Quality Service</h3>
                  <p>Experience professional service with quality gas products and customer support.</p>
                </div>
              </div>
            </div>

            <div class="cta-section">
              <h3>Ready to place your first order?</h3>
              <p>Start browsing our gas products and experience the convenience of Onolo Gas delivery!</p>
              <a href="https://orders-onologroup.online" class="cta-button">
                🛒 Start Shopping Now
              </a>
            </div>

            <div class="spam-notice">
              <strong>📧 Important:</strong> Please check your spam/junk folder for future emails from us. To ensure you receive all our communications, add <strong>orders@orders-onologroup.online</strong> to your contacts or safe sender list.
            </div>

            <div class="contact-info">
              <h3>Need Help? We're Here for You!</h3>
              <p><strong>📞 Phone:</strong> +27 11 464 5073</p>
              <p><strong>📧 Email:</strong> info@onologroup.com</p>
              <p><strong>🌐 Website:</strong> orders-onologroup.online</p>
              <p><strong>⏰ Support Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM</p>
            </div>

            <p>Thank you for choosing Onolo Gas. We're committed to providing you with exceptional service and look forward to serving you!</p>

            <p>Best regards,<br>
            <strong>The Onolo Gas Team</strong></p>
          </div>

          <div class="footer">
            <p>&copy; ${currentYear} Onolo Group. All rights reserved.</p>
            <div class="social-links">
              <a href="https://orders-onologroup.online">Visit Our Website</a> |
              <a href="mailto:info@onologroup.com">Contact Support</a>
            </div>
            <p>This email was sent to ${email || 'you'} because you created an account with Onolo Gas.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/welcome-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
