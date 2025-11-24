import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isSupabaseConfigured } from './client'

export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    // Return a mock client if Supabase isn't configured
    return createClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    ) as any
  }

  try {
    const cookieStore = await cookies()
    return createServerComponentClient({ cookies: () => cookieStore })
  } catch (error) {
    // Fallback to mock client if initialization fails
    return createClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    ) as any
  }
}

