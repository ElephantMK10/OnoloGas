import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { getPaymentReturnUrls, getApiBaseUrl } from '../config/deployment';

// PayFast configuration for production
const PAYFAST_CONFIG = {
  // Production credentials
  merchantId: '30596897',
  merchantKey: 'ygodvejftqxd4',
  productionUrl: 'https://www.payfast.co.za/eng/process',
  sandboxUrl: 'https://sandbox.payfast.co.za/eng/process',
  // Always set to false for production transactions
  useSandbox: false,
};

export interface PayFastPaymentData {
  merchantId: string;
  merchantKey: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl?: string;
  nameFirst: string;
  nameLast: string;
  emailAddress: string;
  cellNumber?: string;
  mPaymentId: string;
  amount: number;
  itemName: string;
  itemDescription?: string;
  signature: string;
}

// PayFast field order as per documentation (minimal required fields)
const PAYFAST_FIELD_ORDER = [
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

// Polyfill for Python's urllib.parse.quote_plus
function quotePlus(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

async function generateSignature(data: Record<string, string | number>, passphrase?: string): Promise<string> {
  let pfOutput = '';
  for (const key of PAYFAST_FIELD_ORDER) {
    if (data[key] !== undefined && data[key] !== '') {
      pfOutput += `${key}=${quotePlus(data[key].toString().trim())}&`;
    }
  }
  // Remove last ampersand
  let getString = pfOutput.slice(0, -1);
  if (passphrase) {
    getString += `&passphrase=${quotePlus(passphrase.trim())}`;
  }
  // Debug log
  console.log('--- PAYFAST DEBUG ---');
  console.log('String to hash:', getString);
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.MD5,
    getString
  );

  console.log('Signature:', signature);
  console.log('---------------------');
  return signature;
}

// Get appropriate URLs based on environment
function getPayFastUrls(orderId: string) {
  // Use centralized configuration
  const urls = getPaymentReturnUrls(orderId);
  return urls.payfast;
}

// Create PayFast payment URL with exact field names and validation
export async function createPayFastPayment(orderData: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  itemName: string;
  itemDescription?: string;
}): Promise<string> {
  console.log('=== Creating PayFast Payment ===');
  console.log('Order data:', orderData);

  // URL is constructed server-side; no local base URL needed
  
  // Split customer name properly
  const nameParts = orderData.customerName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || 'User';

  // Get appropriate URLs based on environment
  const { returnUrl, cancelUrl, notifyUrl } = getPayFastUrls(orderData.orderId);

  // Prepare payment data with EXACT field names required by PayFast
  const paymentData: Record<string, string | number> = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    name_first: firstName,
    name_last: lastName,
    email_address: orderData.customerEmail,
    m_payment_id: orderData.orderId,
    amount: orderData.amount.toFixed(2),
    item_name: orderData.itemName,
    item_description: orderData.itemDescription || `Gas delivery order ${orderData.orderId}`,
  };

  console.log('Payment data before server signing:', paymentData);

  // Request signed URL from Netlify function (with fallback path)
  const apiBase = getApiBaseUrl();
  const endpoints = [
    `${apiBase}/api/payfast-sign`,
    `${apiBase}/.netlify/functions/payfast-sign`,
  ];

  let finalUrl: string | undefined;
  let lastError: any;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...paymentData, useSandbox: PAYFAST_CONFIG.useSandbox }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn('payfast-sign error:', res.status, endpoint, text.slice(0, 200));
        lastError = new Error(`payfast-sign failed: ${res.status}`);
        continue;
      }
      const json = await res.json();
      finalUrl = json.url;
      break;
    } catch (e) {
      console.warn('payfast-sign fetch exception for', endpoint, e);
      lastError = e;
    }
  }

  if (!finalUrl) {
    throw lastError || new Error('Failed to sign PayFast payment');
  }

  console.log('Final PayFast URL (from server):', finalUrl);
  console.log('=== End PayFast Payment Creation ===');

  return finalUrl;
}

// Verify PayFast payment signature (for webhook handling)
export async function verifyPayFastPayment(data: Record<string, string>): Promise<boolean> {
  console.log('=== Verifying PayFast Payment ===');
  console.log('Received data:', data);
  
  const { signature, ...dataWithoutSignature } = data;
  
  if (!signature) {
    console.log('No signature provided');
    return false;
  }
  
  // Generate expected signature (client-side check only; server verifies with secret)
  const expectedSignature = await generateSignature(dataWithoutSignature);
  
  console.log('Received signature:', signature);
  console.log('Expected signature:', expectedSignature);
  console.log('Signatures match:', signature === expectedSignature);
  console.log('=== End Verification ===');
  
  return signature === expectedSignature;
}

// Validate PayFast payment data before submission
function validatePayFastData(orderData: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  itemDescription?: string;
}): void {
  if (!orderData.orderId || orderData.orderId.trim() === '') {
    throw new Error('Order ID is required');
  }
  
  if (!orderData.customerName || orderData.customerName.trim() === '') {
    throw new Error('Customer name is required');
  }
  
  if (!orderData.customerEmail || orderData.customerEmail.trim() === '') {
    throw new Error('Customer email is required');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(orderData.customerEmail)) {
    throw new Error('Valid customer email is required');
  }
  
  if (!orderData.amount || orderData.amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  if (!orderData.itemName || orderData.itemName.trim() === '') {
    throw new Error('Item name is required');
  }
  
  // Validate amount format (max 2 decimal places)
  if (!/^\d+(\.\d{1,2})?$/.test(orderData.amount.toFixed(2))) {
    throw new Error('Amount must have maximum 2 decimal places');
  }

  // Minimum amount check (PayFast requirement)
  if (orderData.amount < 5.00) {
    throw new Error('Minimum payment amount is R5.00');
  }
}

// Open PayFast payment in browser
export async function initiatePayFastPayment(orderData: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  itemDescription?: string;
}): Promise<{ success: boolean; redirectUrl?: string }> {
  try {
    console.log('=== Initiating PayFast Payment ===');
    
    // Validate all required data
    validatePayFastData(orderData);
    
    // Create payment URL
    const paymentUrl = await createPayFastPayment(orderData);
    
    console.log('Opening PayFast payment URL...');
    console.log('PayFast URL:', paymentUrl);
    
    console.log('PayFast payment initiated successfully');
    return { success: true, redirectUrl: paymentUrl };
  } catch (error) {
    console.error('Error initiating PayFast payment:', error);
    return { success: false };
  }
}

// Test signature generation with known values (only used for testing)
export async function testSignatureGeneration(): Promise<string> {
  console.log('=== Testing PayFast Signature Generation ===');
  
  // Test with production credentials
  const testData = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: 'https://orders-onologroup.online/payfast-success',
    cancel_url: 'https://orders-onologroup.online/payfast-cancel',
    notify_url: 'https://orders-onologroup.online/api/payfast-notify',
    name_first: 'Test',
    name_last: 'Customer',
    email_address: 'test@example.com',
    m_payment_id: 'TEST-' + Date.now(),
    amount: 100.00,
    item_name: 'Test Payment',
  };
  
  const signature = await generateSignature(testData);
  console.log('Test signature result:', signature);
  console.log('=== End Test ===');
  
  return signature;
}