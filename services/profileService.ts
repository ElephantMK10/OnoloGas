import { supabase } from '../lib/supabase'

type Input = {
  id: string
  first_name?: string
  last_name?: string
  phone?: string
  address?: string
}

export async function updateProfileRow(input: Input) {
  const { id, ...payload } = input
  console.log('updateProfileRow:start', input)

  // Use upsert so a missing row doesn't cause a no-op
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      { id, ...payload, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    .select('*')
    .maybeSingle()

  if (error) {
    console.log('updateProfileRow:error', error)
    throw new Error(error.message || 'Failed to update profile')
  }
  if (!data) {
    throw new Error('No profile row returned')
  }

  console.log('updateProfileRow:success', data)
  return data
}