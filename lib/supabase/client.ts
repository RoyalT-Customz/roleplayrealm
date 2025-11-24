import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Check if Supabase is configured
export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Check if both are set and not placeholder values
  const isConfigured = !!(
    url &&
    key &&
    url !== 'your_supabase_project_url' &&
    !url.includes('placeholder') &&
    url.startsWith('https://') &&
    key.length > 20 // Basic validation that it's a real key
  )
  
  return isConfigured
}

export function createSupabaseClient() {
  // Return a mock client if Supabase isn't configured
  if (!isSupabaseConfigured()) {
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
    return createClientComponentClient()
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

// Server-side client with service role key
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'your_supabase_project_url') {
    // Return a mock client for development
    return createClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

