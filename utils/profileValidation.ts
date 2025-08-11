interface ProfileData {
  name: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  postalCode: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateProfileData(data: ProfileData): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Name is required';
  }

  // Validate email
  if (!data.email || data.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  // Validate phone
  if (!data.phone || data.phone.trim().length === 0) {
    errors.phone = 'Phone number is required';
  } else if (!/^0\d{9}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.phone = 'Invalid phone number format';
  }

  // Validate street address
  if (!data.streetAddress || data.streetAddress.trim().length === 0) {
    errors.streetAddress = 'Street address is required';
  }

  // Validate city
  if (!data.city || data.city.trim().length === 0) {
    errors.city = 'City is required';
  }

  // Validate postal code (optional)
  if (data.postalCode && !/^\d{4}$/.test(data.postalCode)) {
    errors.postalCode = 'Invalid postal code format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
