import { verifyPayFastPayment } from '../../utils/payfast';

export async function POST(request: Request) {
  try {
    console.log('PayFast Notification Webhook received');
    
    if (!request.body) {
      return new Response('No data received', { status: 400 });
    }
    
    // Parse the request body
    const formData = await request.formData();
    const payFastData: Record<string, string> = {};
    
    // Convert FormData to plain object
    formData.forEach((value, key) => {
      payFastData[key] = value.toString();
    });
    
    console.log('PayFast notification data:', payFastData);
    
    // Verify the payment data signature
    const isValid = verifyPayFastPayment(payFastData);
    
    if (!isValid) {
      console.error('Invalid PayFast signature');
      return new Response('Invalid signature', { status: 400 });
    }
    
    // Check payment status
    const paymentStatus = payFastData.payment_status;
    
    if (paymentStatus === 'COMPLETE') {
      // Payment successful
      const orderId = payFastData.m_payment_id;
      const amount = parseFloat(payFastData.amount_gross);
      
      console.log(`PayFast payment completed: Order ${orderId}, Amount: R${amount}`);
      
      // Note: In a real implementation, you'd update the order status in your database here
      // This could involve:
      // 1. Querying the database to find the order
      // 2. Updating its payment status to "paid"
      // 3. Potentially triggering other workflows (email notifications, etc.)
      
      // For this example, we just acknowledge receipt
      return new Response('OK', { status: 200 });
      
    } else {
      console.log(`PayFast payment not complete: ${paymentStatus}`);
      return new Response(`Payment status: ${paymentStatus}`, { status: 200 });
    }
    
  } catch (error) {
    console.error('Error processing PayFast notification:', error);
    return new Response('Server error', { status: 500 });
  }
}