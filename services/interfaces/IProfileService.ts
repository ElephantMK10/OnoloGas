export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  streetAddress?: string;
  apartment?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface ProfileUpdateProgress {
  step: string;
  status: 'pending' | 'inProgress' | 'completed' | 'error';
  message?: string;
  error?: string;
}

export interface ProfileUpdateResult {
  success: boolean;
  progress: ProfileUpdateProgress[];
  error?: string;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  defaultDeliveryWindow?: string;
  defaultLatitude?: number;
  defaultLongitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IProfileService {
  /**
   * Get user profile by ID
   */
  getProfile(userId: string): Promise<UserProfile | null>;
  
  /**
   * Update user profile with progress tracking
   */
  updateProfile(
    userId: string, 
    data: ProfileUpdateData
  ): Promise<ProfileUpdateResult>;
  
  /**
   * Validate profile data before update
   */
  validateProfileData(data: ProfileUpdateData): Promise<ProfileValidationResult>;
  
  /**
   * Upload profile avatar
   */
  uploadAvatar(userId: string, file: File): Promise<string>;
  
  /**
   * Delete user profile
   */
  deleteProfile(userId: string): Promise<boolean>;
  
  /**
   * Get profile completion percentage
   */
  getProfileCompletion(userId: string): Promise<number>;
  
  /**
   * Search profiles (admin only)
   */
  searchProfiles(query: string, filters?: any): Promise<UserProfile[]>;
}