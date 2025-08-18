const crypto = require('crypto');

const PROCESS_URL = 'https://www.payfast.co.za/eng/process';
const SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process';

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

const PASS = process.env.PAYFAST_PASSPHRASE || '';
const quotePlus = (v) => encodeURIComponent(String(v)).replace(/%20/g, '+');

function buildSignature(data) {
  let s = '';
  for (const k of FIELD_ORDER) {
    const val = data[k];
    if (val !== undefined && val !== '') s += `${k}=${quotePlus(String(val).trim())}&`;
  }
  if (s.endsWith('&')) s = s.slice(0, -1);
  if (PASS) s += `&passphrase=${quotePlus(PASS.trim())}`;
  return crypto.createHash('md5').update(s).digest('hex');
}

function buildQueryString(data) {
  return (
    FIELD_ORDER
      .filter((k) => data[k] !== undefined && data[k] !== '')
      .map((k) => `${k}=${quotePlus(String(data[k]).trim())}`)
      .join('&') + `&signature=${data.signature}`
  );
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: 'No data received' };
    }

    let payload;
    try { payload = JSON.parse(event.body); } catch (e) {
      return { statusCode: 400, headers, body: 'Invalid JSON' };
    }

    const input = {};
    for (const k of FIELD_ORDER) {
      const v = payload[k];
      if (v !== undefined && v !== null) input[k] = String(v);
    }

    const useSandbox = Boolean(payload.useSandbox);

    const signature = buildSignature(input);
    const dataWithSig = { ...input, signature };

    const base = useSandbox ? SANDBOX_URL : PROCESS_URL;
    const query = buildQueryString(dataWithSig);
    const url = `${base}?${query}`;

    return { statusCode: 200, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ url, signature }) };
  } catch (err) {
    console.error('Error in payfast-sign function', err);
    return { statusCode: 500, headers, body: 'Server error' };
  }
};

