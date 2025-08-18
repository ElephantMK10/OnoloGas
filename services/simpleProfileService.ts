import { supabase } from '../lib/supabase'

/**
 * SIMPLE profile update service - no complex session management
 * Just update the profile directly with minimal error handling
 */
export async function simpleUpdateProfile(userId: string, profileData: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
}) {
  console.log('🔥 SIMPLE: Starting profile update for user:', userId);
  console.log('🔥 SIMPLE: Profile data:', profileData);

  try {
    // Direct database update - no session wrappers, no timeouts, no complexity
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('🔥 SIMPLE: Database error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }

    if (!data) {
      console.error('🔥 SIMPLE: No data returned');
      throw new Error('No profile data returned');
    }

    console.log('🔥 SIMPLE: Profile updated successfully:', data);
    return data;
  } catch (error: any) {
    console.error('🔥 SIMPLE: Profile update failed:', error);
    throw error;
  }
}
