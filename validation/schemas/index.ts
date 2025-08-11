import { z } from 'zod';

// Base validation schemas
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be at most 15 digits')
  .regex(/^[\+]?[\d\s\-\(\)]+$/, 'Please enter a valid phone number');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be at most 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const addressSchema = z
  .string()
  .min(10, 'Address must be at least 10 characters')
  .max(500, 'Address must be at most 500 characters');

export const postalCodeSchema = z
  .string()
  .regex(/^\d{4}$/, 'Postal code must be 4 digits (South African format)')
  .optional();

// Profile validation schema
export const ProfileUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema,
  streetAddress: addressSchema,
  apartment: z.string().max(100, 'Apartment/Unit must be at most 100 characters').optional(),
  city: z.string().min(2, 'City must be at least 2 characters').max(100, 'City must be at most 100 characters'),
  state: z.string().max(100, 'State/Province must be at most 100 characters').optional(),
  postalCode: postalCodeSchema,
  country: z.string().min(2, 'Country must be at least 2 characters').max(100, 'Country must be at most 100 characters'),
});

// Order validation schemas
export const OrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().positive('Price must be positive'),
});

export const CreateOrderSchema = z.object({
  customerName: nameSchema,
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  deliveryAddress: addressSchema,
  paymentMethod: z.enum(['card_on_delivery', 'card', 'payfast', 'eft'], {
    errorMap: () => ({ message: 'Please select a valid payment method' }),
  }),
  totalAmount: z.number().positive('Total amount must be positive').min(5, 'Minimum order amount is R5.00'),
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
  deliveryDate: z.string().optional(),
  deliverySchedule: z.string().optional(),
  preferredDeliveryWindow: z.enum(['morning', 'afternoon', 'evening']).optional(),
});

// Message validation schemas
export const CreateMessageSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  subject: z.string().min(1, 'Message content is required').max(500, 'Message must be at most 500 characters'),
  message: z.string().min(1, 'Message content is required').max(1000, 'Message must be at most 1000 characters'),
  logType: z.enum(['user_message', 'staff_message', 'order_status_update']).default('user_message'),
  senderType: z.enum(['customer', 'staff']).default('customer'),
  orderId: z.string().optional(),
});

// Notification validation schemas
export const NotificationSettingsSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean(),
});

export const NotificationPreferencesSchema = z.object({
  orderUpdates: z.boolean(),
  promotions: z.boolean(),
  newsletter: z.boolean(),
});

export const NotificationRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  body: z.string().min(1, 'Body is required').max(500, 'Body must be at most 500 characters'),
  data: z.record(z.any()).optional(),
  channels: z.array(z.enum(['email', 'sms', 'push'])).min(1, 'At least one channel is required'),
});

// Authentication validation schemas
export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// PayFast payment validation schema
export const PayFastPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().positive('Amount must be positive').min(5, 'Minimum payment amount is R5.00'),
  customerName: nameSchema,
  customerEmail: emailSchema,
  customerPhone: phoneSchema.optional(),
  itemName: z.string().min(1, 'Item name is required').max(100, 'Item name must be at most 100 characters'),
  itemDescription: z.string().max(255, 'Item description must be at most 255 characters').optional(),
});

// Utility functions for validation
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

export const getValidationErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  }
  
  return errors;
};

// Export all schemas
export type ProfileUpdateData = z.infer<typeof ProfileUpdateSchema>;
export type CreateOrderData = z.infer<typeof CreateOrderSchema>;
export type OrderItemData = z.infer<typeof OrderItemSchema>;
export type CreateMessageData = z.infer<typeof CreateMessageSchema>;
export type NotificationSettingsData = z.infer<typeof NotificationSettingsSchema>;
export type NotificationPreferencesData = z.infer<typeof NotificationPreferencesSchema>;
export type NotificationRequestData = z.infer<typeof NotificationRequestSchema>;
export type LoginData = z.infer<typeof LoginSchema>;
export type RegisterData = z.infer<typeof RegisterSchema>;
export type PayFastPaymentData = z.infer<typeof PayFastPaymentSchema>;