// Email sending is now handled by Netlify serverless functions to avoid CORS issues

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  orderDate: string;
  orderItems: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
  deliveryAddress: string;
  deliverySchedule?: string;
}

export const sendOrderConfirmationEmail = async (orderData: OrderEmailData): Promise<boolean> => {
  try {
    // Generate HTML for order items
    const orderItemsHtml = orderData.orderItems
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; color: #333;">${item.productName}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; color: #333;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; color: #333;">R ${item.price.toFixed(2)}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; color: #333; font-weight: bold;">R ${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `,
      )
      .join('');

    // Create email HTML with improved styling
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Onolo Gas</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #FF6B00 0%, #FF8A00 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content { 
            padding: 30px 20px; 
            background-color: white;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
          }
          .order-info {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #FF6B00;
          }
          .order-info h3 {
            margin: 0 0 15px 0;
            color: #FF6B00;
            font-size: 18px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
          }
          .info-label {
            font-weight: 600;
            color: #555;
          }
          .info-value {
            color: #333;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          th { 
            background-color: #FF6B00; 
            color: white;
            text-align: left; 
            padding: 15px 8px;
            font-weight: 600;
            font-size: 14px;
          }
          th:nth-child(2), th:nth-child(3), th:nth-child(4) {
            text-align: center;
          }
          th:nth-child(4) {
            text-align: right;
          }
          .total-row { 
            font-weight: bold; 
            background-color: #f8f9fa;
            border-top: 2px solid #FF6B00;
          }
          .total-row td {
            padding: 15px 8px;
            font-size: 16px;
          }
          .status-badge {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .footer { 
            background-color: #2c3e50;
            color: white;
            padding: 30px 20px; 
            text-align: center; 
            font-size: 14px;
          }
          .footer a {
            color: #FF6B00;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .divider {
            height: 2px;
            background: linear-gradient(to right, #FF6B00, #FF8A00);
            margin: 20px 0;
          }
          .next-steps {
            background-color: #e8f4fd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #007bff;
          }
          .next-steps h3 {
            color: #007bff;
            margin: 0 0 10px 0;
          }
          @media only screen and (max-width: 600px) {
            .container { margin: 0; }
            .content { padding: 20px 15px; }
            .header { padding: 20px 15px; }
            .info-row { flex-direction: column; }
            .info-row .info-value { margin-top: 5px; font-weight: bold; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔥 Order Confirmed!</h1>
            <p>Thank you for choosing Onolo Gas</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Dear ${orderData.customerName},
            </div>
            
            <p>Great news! We've received your order and it's being processed. You'll receive updates as your order progresses through our system.</p>
            
            <div class="order-info">
              <h3>📋 Order Details</h3>
              <div class="info-row">
                <span class="info-label">Order ID:</span>
                <span class="info-value">#${orderData.orderId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Order Date:</span>
                <span class="info-value">${orderData.orderDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value"><span class="status-badge">Pending</span></span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${orderData.paymentMethod}</span>
              </div>
              ${
                orderData.deliverySchedule
                  ? `
              <div class="info-row">
                <span class="info-label">Delivery Schedule:</span>
                <span class="info-value">${orderData.deliverySchedule}</span>
              </div>
              `
                  : ''
              }
            </div>
            
            <div class="divider"></div>
            
            <h3>🛒 Order Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: center;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right; padding: 15px 8px;"><strong>Grand Total:</strong></td>
                  <td style="text-align: right; padding: 15px 8px; color: #FF6B00;"><strong>R ${orderData.totalAmount.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="order-info">
              <h3>🚚 Delivery Information</h3>
              <div class="info-row">
                <span class="info-label">Delivery Address:</span>
                <span class="info-value">${orderData.deliveryAddress}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Estimated Delivery:</span>
                <span class="info-value">1-2 working days</span>
              </div>
            </div>
            
            <div class="next-steps">
              <h3>🎯 What's Next?</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>We'll confirm your order within 1 hour</li>
                <li>Your order will be prepared for delivery</li>
                <li>You'll receive SMS/email updates on delivery status</li>
                <li>Our driver will contact you 30 minutes before delivery</li>
              </ul>
            </div>
            
            <div class="divider"></div>
            
            <p><strong>Need help?</strong> Contact our customer service team:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>📞 Phone: +27 11 464 5073</li>
              <li>📧 Email: info@onologroup.com</li>
              <li>🌐 Website: www.onologroup.com</li>
            </ul>
            
            <p>Thank you for choosing Onolo Gas for your energy needs!</p>
          </div>
          
          <div class="footer">
            <p><strong>Onolo Group (Pty) Ltd</strong></p>
            <p>308 Knoppieslaagte Farm, Meerkat Rd<br>
            Timsrand AH, Centurion, South Africa</p>
            <p style="margin-top: 20px;">
              <a href="mailto:info@onologroup.com">info@onologroup.com</a> | 
              <a href="https://www.onologroup.com">www.onologroup.com</a>
            </p>
            <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
              This is an automated email. Please do not reply to this message.<br>
              &copy; ${new Date().getFullYear()} Onolo Group. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Netlify function instead of direct API call
    const response = await fetch('https://orders-onologroup.netlify.app/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailData: {
          customerEmail: orderData.customerEmail,
          subject: `🔥 Order Confirmation #${orderData.orderId} - Onolo Gas`,
          html: emailHtml,
        },
      }),
    });

    // Read response body only once
    const responseText = await response.text();

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error sending email - non-JSON response:', responseText);
        errorData = { error: 'Server returned non-JSON response', details: responseText };
      }
      console.error('Error sending email:', errorData);
      return false;
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      console.error('Response text:', responseText);
      return false;
    }
    console.log('Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};

export const sendOrderStatusUpdateEmail = async (
  orderData: OrderEmailData & { status: string },
): Promise<boolean> => {
  try {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      preparing: 'Your order is currently being prepared for delivery.',
      out_for_delivery: 'Great news! Your order is on its way to you.',
      delivered: 'Your order has been successfully delivered. Thank you for choosing Onolo Gas!',
      cancelled: 'Your order has been cancelled as requested.',
    };

    const statusColors = {
      confirmed: '#007bff',
      preparing: '#ffc107',
      out_for_delivery: '#FF6B00',
      delivered: '#28a745',
      cancelled: '#dc3545',
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update - Onolo Gas</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, ${statusColors[orderData.status] || '#FF6B00'} 0%, ${statusColors[orderData.status] || '#FF8A00'} 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .content { 
            padding: 30px 20px; 
            background-color: white;
          }
          .status-update {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid ${statusColors[orderData.status] || '#FF6B00'};
            text-align: center;
          }
          .footer { 
            background-color: #2c3e50;
            color: white;
            padding: 20px; 
            text-align: center; 
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Status Update</h1>
            <p>Order #${orderData.orderId}</p>
          </div>
          
          <div class="content">
            <p>Dear ${orderData.customerName},</p>
            
            <div class="status-update">
              <h2 style="color: ${statusColors[orderData.status] || '#FF6B00'}; margin: 0 0 10px 0;">
                ${orderData.status.replace('_', ' ').toUpperCase()}
              </h2>
              <p style="margin: 0; font-size: 16px;">
                ${statusMessages[orderData.status] || 'Your order status has been updated.'}
              </p>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact us at +27 11 464 5073 or info@onologroup.com.</p>
            
            <p>Thank you for choosing Onolo Gas!</p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Onolo Group. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Netlify function instead of direct API call
    const response = await fetch('https://orders-onologroup.netlify.app/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailData: {
          customerEmail: orderData.customerEmail,
          subject: `Order Update #${orderData.orderId} - ${orderData.status.replace('_', ' ').toUpperCase()}`,
          html: emailHtml,
        },
      }),
    });

    // Read response body only once
    const responseText = await response.text();

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error sending status update email - non-JSON response:', responseText);
        errorData = { error: 'Server returned non-JSON response', details: responseText };
      }
      console.error('Error sending status update email:', errorData);
      return false;
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing status update response:', parseError);
      console.error('Response text:', responseText);
      return false;
    }
    console.log('Status update email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Error sending order status update email:', error);
    return false;
  }
};
