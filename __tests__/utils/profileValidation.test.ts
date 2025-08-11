import { validateProfileData } from '../../utils/profileValidation';

describe('validateProfileData', () => {
  it('should validate a correct profile', () => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '0821234567',
      streetAddress: '123 Main St',
      city: 'Johannesburg',
      postalCode: '2000',
    };
    const result = validateProfileData(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should catch missing required fields', () => {
    const data = {
      name: '',
      email: '',
      phone: '',
      streetAddress: '',
      city: '',
      postalCode: '',
    };
    const result = validateProfileData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty('name');
    expect(result.errors).toHaveProperty('phone');
    expect(result.errors).toHaveProperty('streetAddress');
    expect(result.errors).toHaveProperty('city');
  });
});
