import { supabase } from '../lib/supabase';

// BASIC profile update - just the absolute minimum needed
export async function updateUserProfile(userId: string, updates: {
  first_name?: string;
  last_name?: string; 
  phone?: string;
  address?: string;
}) {
  console.log('BASIC: Updating profile for', userId, updates);
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
    
  if (error) {
    console.error('BASIC: Update failed:', error);
    throw error;
  }
  
  console.log('BASIC: Update successful:', data);
  return data;
}
