'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, Search, Users, ShoppingBag, Calendar, User, LogOut, Settings, Shield, Crown, HelpCircle } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { Avatar } from '@/components/ui/Avatar'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

export function Navbar() {
  const { user, loading, isConfigured } = useAuth()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [showMenu, setShowMenu] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [username, setUsername] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  const OWNER_EMAIL = 'kingroyalt.vu@gmail.com'

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !isConfigured) return
      
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          setAvatarUrl(data.avatarUrl || null)
          setUsername(data.username || '')
          setIsAdmin(data.isAdmin || false)
          setIsOwner(user.email === OWNER_EMAIL)
        }
      } catch (error) {
        console.error('Error fetching user profile for navbar:', error)
      }
    }

    fetchUserProfile()
  }, [user, isConfigured])

  const handleSignOut = async () => {
    if (isConfigured) {
      try {
        await supabase.auth.signOut()
      } catch (error) {
        console.warn('Sign out failed:', error)
      }
    }
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-40 bg-dark-800 border-b border-dark-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              Roleplay Realm
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors">
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link href="/servers" className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors">
              <Users className="w-5 h-5" />
              <span>Servers</span>
            </Link>
            <Link href="/marketplace" className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors">
              <ShoppingBag className="w-5 h-5" />
              <span>Marketplace</span>
            </Link>
            <Link href="/events" className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors">
              <Calendar className="w-5 h-5" />
              <span>Events</span>
            </Link>
            <Link href="/search" className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
              <span>Search</span>
            </Link>
            <Link href="/support" className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors">
              <HelpCircle className="w-5 h-5" />
              <span>Support</span>
            </Link>
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors">
                <Shield className="w-5 h-5" />
                <span>Admin</span>
              </Link>
            )}
            {isOwner && (
              <Link href="/owners" className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors">
                <Crown className="w-5 h-5" />
                <span>Owners</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!isConfigured ? (
              <div className="text-xs text-dark-400 px-3 py-1 bg-dark-700 rounded">
                Preview Mode
              </div>
            ) : loading ? (
              <div className="text-dark-400">Loading...</div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2"
                >
                  <Avatar size="sm" src={avatarUrl || undefined} alt={username || user?.email || 'User'} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-lg py-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-dark-700 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-dark-700 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-dark-700 transition-colors text-primary-400"
                        onClick={() => setShowMenu(false)}
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin</span>
                      </Link>
                    )}
                    {isOwner && (
                      <Link
                        href="/owners"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-dark-700 transition-colors text-yellow-400"
                        onClick={() => setShowMenu(false)}
                      >
                        <Crown className="w-4 h-4" />
                        <span>Owners</span>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-dark-700 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/signin" className="btn btn-secondary">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

