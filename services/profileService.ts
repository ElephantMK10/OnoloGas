import { supabase } from '../lib/supabase'
import { isAuthError, log } from '../lib/supabase'

type Input = {
  id: string
  first_name?: string
  last_name?: string
  phone?: string
  address?: string
}

export async function updateProfileRow(input: Input) {
  const requestId = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  log.info(`[${requestId}] updateProfileRow:start`, { userId: input.id })
  console.log(`[${requestId}] updateProfileRow:start`, { userId: input.id })

  try {
    // Step 1: Verify session
    console.log(`[${requestId}] Step 1: Getting session...`);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error(`[${requestId}] Session error:`, sessionError);
      throw new Error('Session expired. Please sign in again.');
    }
    
    if (!session?.user) {
      console.error(`[${requestId}] No session or user found`);
      throw new Error('Session expired. Please sign in again.');
    }
    
    console.log(`[${requestId}] Session verified for user: ${session.user.id}`);
    
    // Step 2: Prepare update data
    const { id, ...payload } = input;
    const updateData = { id, ...payload, updated_at: new Date().toISOString() };
    
    log.info(`[${requestId}] Step 2: Updating profile with data:`, updateData);
    console.log(`[${requestId}] Step 2: Updating profile with data:`, updateData);
    
    // Step 3: Execute database update
    console.log(`[${requestId}] Step 3: Executing upsert to profiles table...`);
    const { data, error } = await supabase
      .from('profiles')
      .upsert(updateData, { onConflict: 'id' })
      .select('*')
      .single();

    console.log(`[${requestId}] Step 3 complete - data:`, data, 'error:', error);

    if (error) {
      log.error(`[${requestId}] updateProfileRow:error`, error)
      console.error(`[${requestId}] Database error details:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(error.message || 'Failed to update profile')
    }
    
    if (!data) {
      log.error(`[${requestId}] No profile row returned`)
      console.error(`[${requestId}] No profile row returned`)
      throw new Error('No profile row returned')
    }

    // Step 4: Update auth user metadata to keep in sync
    if (data.first_name || data.last_name) {
      const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      console.log(`[${requestId}] Step 4: Updating auth user metadata with name: ${fullName}`);
      
      try {
        // Check if updateUser method exists (might not exist on mock client)
        const authClient = supabase.auth as any;
        if (authClient && typeof authClient.updateUser === 'function') {
          await authClient.updateUser({
            data: {
              name: fullName,
              full_name: fullName,
            }
          });
          console.log(`[${requestId}] Auth metadata updated successfully`);
        } else {
          console.log(`[${requestId}] updateUser not available on auth client`);
        }
      } catch (metadataError) {
        console.warn(`[${requestId}] Failed to update auth metadata:`, metadataError);
        // Don't fail the whole operation for metadata update failure
      }
    }

    log.info(`[${requestId}] Profile update successful, returned data:`, data);
    console.log(`[${requestId}] SUCCESS: Profile update completed, returned data:`, data);
    
    return data;
  } catch (error: any) {
    log.error(`[${requestId}] updateProfileRow failed:`, error)
    console.error(`[${requestId}] FAILED: Profile update error:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    // Check for auth errors
    if (isAuthError(error)) {
      log.error(`[${requestId}] Profile update failed due to authentication error:`, error)
      throw new Error('Session expired. Please sign in again.')
    }
    
    throw error
  }
}