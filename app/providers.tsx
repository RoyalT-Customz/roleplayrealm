'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isConfigured: false })

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(false)
  
  useEffect(() => {
    // Check configuration on mount
    const checkConfig = () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Supabase config check:', {
          hasUrl: !!url,
          hasKey: !!key,
          url: url?.substring(0, 30) + '...',
        })
      }
      
      const configured = isSupabaseConfigured()
      setIsConfigured(configured)
      return configured
    }
    
    const configured = checkConfig()
    
    if (!configured) {
      // Skip auth if Supabase isn't configured
      console.warn('Supabase not configured - running in preview mode. Check your .env file.')
      setLoading(false)
      return
    }

    try {
      const supabase = createSupabaseClient()

      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }).catch(() => {
        // If auth fails, just set loading to false
        setLoading(false)
      })

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    } catch (error) {
      // If initialization fails, just continue without auth
      console.warn('Supabase not configured, running in preview mode')
      setLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isConfigured }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

