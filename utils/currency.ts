const API_URL = 'https://open.er-api.com/v6/latest/ZAR';

/**
 * Converts an amount from ZAR to USD using a public exchange rate API.
 * @param amountInZAR The amount in South African Rand.
 * @returns The equivalent amount in US Dollars, rounded to 2 decimal places.
 */
export const convertZARtoUSD = async (amountInZAR: number): Promise<number> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates from API.');
    }
    const data = await response.json();
    const usdRate = data.rates.USD;

    if (!usdRate) {
      throw new Error('USD exchange rate not available in API response.');
    }

    const amountInUSD = amountInZAR * usdRate;
    // Round to 2 decimal places for currency calculations
    return Math.round(amountInUSD * 100) / 100;
  } catch (error) {
    console.error('Live currency conversion failed:', error);
    // As a fallback, use a static rate to prevent a total failure.
    // This rate is an approximation and should be updated periodically.
    const fallbackRate = 0.054; // Approximate rate: 1 ZAR ≈ 0.054 USD
    const fallbackAmountInUSD = amountInZAR * fallbackRate;
    return Math.round(fallbackAmountInUSD * 100) / 100;
  }
};
