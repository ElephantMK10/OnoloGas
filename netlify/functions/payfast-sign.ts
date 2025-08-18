import type { Handler } from '@netlify/functions';
import crypto from 'crypto';

// Read secrets from environment variables (set these in Netlify)
const PASS = process.env.PAYFAST_PASSPHRASE || '';

// PayFast process URLs
const PROCESS_URL = 'https://www.payfast.co.za/eng/process';
const SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process';

// Field order as used when generating signature for request
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
] as const;

const quotePlus = (v: string) => encodeURIComponent(v).replace(/%20/g, '+');

function buildSignature(data: Record<string, string>) {
  let s = '';
  for (const k of FIELD_ORDER) {
    const val = data[k];
    if (val !== undefined && val !== '') {
      s += `${k}=${quotePlus(val.trim())}&`;
    }
  }
  if (s.endsWith('&')) s = s.slice(0, -1);
  if (PASS) s += `&passphrase=${quotePlus(PASS.trim())}`;
  return crypto.createHash('md5').update(s).digest('hex');
}

function buildQueryString(data: Record<string, string>) {
  return (
    FIELD_ORDER
      .filter((k) => data[k] !== undefined && data[k] !== '')
      .map((k) => `${k}=${quotePlus(String(data[k]).trim())}`)
      .join('&') + `&signature=${data.signature}`
  );
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!event.body) {
      return { statusCode: 400, body: 'No data received' };
    }

    let payload: any;
    try {
      payload = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, body: 'Invalid JSON' };
    }

    // Expect the client to send exactly the PayFast fields (no signature)
    const input: Record<string, string> = {};
    for (const k of FIELD_ORDER) {
      const v = payload[k];
      if (v !== undefined && v !== null) input[k] = String(v);
    }

    // Optional hint to use sandbox (default false)
    const useSandbox = Boolean(payload.useSandbox);

    // Compute signature
    const signature = buildSignature(input);
    const dataWithSig = { ...input, signature } as Record<string, string>;

    // Build final URL
    const base = useSandbox ? SANDBOX_URL : PROCESS_URL;
    const query = buildQueryString(dataWithSig);
    const url = `${base}?${query}`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, signature }),
    };
  } catch (err) {
    console.error('Error in payfast-sign function', err);
    return { statusCode: 500, body: 'Server error' };
  }
};

export default handler;

