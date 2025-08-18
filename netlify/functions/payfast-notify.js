const crypto = require('crypto');

// Read secrets from environment variables (set these in Netlify)
const PASS = process.env.PAYFAST_PASSPHRASE || '';

// Field order as used when generating signature for request/notify
const FIELD_ORDER = [
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'name_first',
  'name_last',
  'email_address',
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
];

const quotePlus = (v) => encodeURIComponent(String(v)).replace(/%20/g, '+');

function buildSignature(data) {
  let s = '';
  for (const k of FIELD_ORDER) {
    const val = data[k];
    if (val !== undefined && val !== '') {
      s += `${k}=${quotePlus(String(val).trim())}&`;
    }
  }
  if (s.endsWith('&')) s = s.slice(0, -1);
  if (PASS) s += `&passphrase=${quotePlus(PASS.trim())}`;
  return crypto.createHash('md5').update(s).digest('hex');
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!event.body) {
      return { statusCode: 400, body: 'No data received' };
    }

    const parsed = new URLSearchParams(event.body);
    const data = {};
    parsed.forEach((v, k) => (data[k] = v));

    // Extract and verify signature
    const receivedSignature = data.signature;
    delete data.signature;

    const expectedSignature = buildSignature(data);

    if (!receivedSignature || receivedSignature !== expectedSignature) {
      console.error('Invalid PayFast signature', { receivedSignature, expectedSignature });
      return { statusCode: 400, body: 'Invalid signature' };
    }

    const status = data.payment_status;
    const orderId = data.m_payment_id;
    const amount = data.amount || data.amount_gross;

    console.log('PayFast IPN verified', { orderId, status, amount });

    if (status === 'COMPLETE') {
      // TODO: Update your order record as paid in your database here.
      // Example (pseudo): await markOrderPaid(orderId, amount)
    }

    // Always 200 to acknowledge receipt
    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('Error handling PayFast IPN', err);
    return { statusCode: 500, body: 'Server error' };
  }
};

