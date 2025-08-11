import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import { Platform } from 'react-native';
import { testSignatureGeneration } from './payfast';

/**
 * Development-friendly PayFast integration
 * This version provides multiple testing approaches for PayFast integration
 */

const PAYFAST_TESTING_CONFIG = {
  merchantId: '30596897',
  merchantKey: 'ygodvejftqxd4',
  saltPassphrase: 'G4smeupalready',
  sandboxUrl: 'https://sandbox.payfast.co.za/eng/process',
};

// Simple simulation for initial testing
export async function initiatePayFastPaymentDev(orderData: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  itemDescription?: string;
}): Promise<{ success: boolean; redirectUrl?: string }> {
  try {
    console.log('=== PayFast Development Payment (Simulated) ===');
    console.log('Order data:', orderData);

    // Show development mode notification
    Toast.show({
      type: 'info',
      text1: 'Development Mode',
      text2: 'Testing PayFast integration - no real payment processed',
      position: 'bottom',
      visibilityTime: 4000,
    });

    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate successful payment flow
    console.log('Simulating PayFast payment flow...');
    
    // Create success URL with test data for router navigation
    const successUrl = '/payfast-success?' + new URLSearchParams({
      orderId: orderData.orderId,
      amount: orderData.amount.toString(),
      status: 'simulated',
      payment_status: 'COMPLETE',
      merchant_id: PAYFAST_TESTING_CONFIG.merchantId,
      m_payment_id: orderData.orderId,
    }).toString();
    
    return { success: true, redirectUrl: successUrl };
  } catch (error) {
    console.error('Error in PayFast development simulation:', error);
    
    // Show error and navigate to cancel screen
    Toast.show({
      type: 'error',
      text1: 'PayFast Payment Failed',
      text2: 'Payment could not be processed. Please try again.',
      position: 'bottom',
      visibilityTime: 3000,
    });

    const cancelUrl = '/payfast-cancel?' + new URLSearchParams({
      orderId: orderData.orderId,
      status: 'error',
    }).toString();
    
    return { success: false, redirectUrl: cancelUrl };
  }
}

// Advanced testing with actual PayFast sandbox but local return handling
export async function initiatePayFastPaymentAdvancedTest(orderData: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  itemDescription?: string;
}): Promise<{ success: boolean; redirectUrl?: string }> {
  try {
    console.log('=== PayFast Advanced Testing ===');
    
    // Create a test payment URL using webhook.site for returns
    const webhookId = 'test-' + Date.now();
    const testingUrls = {
      returnUrl: `https://webhook.site/${webhookId}/success`,
      cancelUrl: `https://webhook.site/${webhookId}/cancel`,
      notifyUrl: `https://webhook.site/${webhookId}/notify`,
    };

    console.log('Testing URLs:', testingUrls);
    console.log('Visit https://webhook.site/' + webhookId + ' to see PayFast responses');


    // For now, simulate the advanced test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const successUrl = '/payfast-success?' + new URLSearchParams({
      orderId: orderData.orderId,
      amount: orderData.amount.toString(),
      status: 'advanced_test',
      webhook_id: webhookId,
    }).toString();
    
    return { success: true, redirectUrl: successUrl };
  } catch (error) {
    console.error('Error in PayFast advanced testing:', error);
    return { success: false };
  }
}

// Test with ngrok (requires ngrok to be running)
export function createNgrokTestUrls(ngrokUrl: string, orderId: string) {
  if (!ngrokUrl || !ngrokUrl.startsWith('https://')) {
    throw new Error('Valid ngrok HTTPS URL is required');
  }

  return {
    returnUrl: `${ngrokUrl}/payfast-return?success=true&orderId=${orderId}`,
    cancelUrl: `${ngrokUrl}/payfast-return?success=false&orderId=${orderId}`,
    notifyUrl: `${ngrokUrl}/api/payfast-notify`,
  };
}

// Test signature generation with known values
export function testPayFastSignature() {
  console.log('=== Testing PayFast Signature ===');
  
  const result = testSignatureGeneration();
  
  Toast.show({
    type: 'info',
    text1: 'Signature Test',
    text2: `Generated signature: ${result.substring(0, 8)}...`,
    position: 'bottom',
    visibilityTime: 4000,
  });
  
  return result;
}

// Validate PayFast configuration
export function validatePayFastConfig() {
  const config = PAYFAST_TESTING_CONFIG;
  const issues: string[] = [];
  
  if (!config.merchantId || config.merchantId === '10040008') {
    issues.push('Using test Merchant ID instead of production value');
  }
  
  if (!config.merchantKey || config.merchantKey === 'ph5ub7pps68v2') {
    issues.push('Using test Merchant Key instead of production value');
  }
  
  if (!config.saltPassphrase || config.saltPassphrase === 'gasmeupalready19') {
    issues.push('Using test Salt Passphrase instead of production value');
  }
  
  const isValid = issues.length === 0;
  
  console.log('PayFast Production Configuration Validation:');
  console.log('Valid:', isValid);
  console.log('Issues:', issues);
  
  Toast.show({
    type: isValid ? 'success' : 'error',
    text1: 'PayFast Config',
    text2: isValid ? 'Production configuration valid' : `Issues: ${issues.join(', ')}`,
    position: 'bottom',
    visibilityTime: 4000,
  });
  
  return { isValid, issues };
}

// Development utilities for testing
export const PayFastDevUtils = {
  simulatePayment: initiatePayFastPaymentDev,
  advancedTest: initiatePayFastPaymentAdvancedTest,
  testSignature: testSignatureGeneration,
  validateConfig: validatePayFastConfig,
  createNgrokUrls: createNgrokTestUrls,
};