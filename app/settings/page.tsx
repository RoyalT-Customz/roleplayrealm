'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { User, Mail, Lock, Bell, Shield, Edit, LogOut } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface ProfileData {
  id: string
  email: string
  username: string
  avatarUrl?: string | null
  bio?: string | null
  createdAt: string
}

export default function SettingsPage() {
  const { user, loading: authLoading, isConfigured } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
      return
    }

    if (user) {
      fetchProfile()
    }
  }, [user, authLoading, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile')

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = () => {
    fetchProfile()
  }

  const handleSignOut = async () => {
    if (isConfigured) {
      try {
        const supabase = createSupabaseClient()
        await supabase.auth.signOut()
      } catch (error) {
        console.warn('Sign out failed:', error)
      }
    }
    router.push('/')
    router.refresh()
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Account Section */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary-400" />
            <h2 className="text-xl font-bold">Account</h2>
          </div>

          <div className="space-y-6">
            {/* Profile Info */}
            <div className="flex items-start gap-4 pb-6 border-b border-dark-700">
              <Avatar
                size="lg"
                src={profile.avatarUrl || undefined}
                alt={profile.username}
              />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{profile.username}</h3>
                <p className="text-sm text-dark-300 mb-2">
                  {profile.bio || 'No bio set'}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between py-4 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-dark-300">{profile.email}</p>
                </div>
              </div>
              <span className="text-xs text-dark-400">Verified</span>
            </div>

            {/* Username */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="font-medium">Username</p>
                  <p className="text-sm text-dark-300">@{profile.username}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                Change
              </Button>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-primary-400" />
            <h2 className="text-xl font-bold">Security</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-dark-300">
                    Last changed: Recently
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" disabled>
                Change Password
              </Button>
            </div>
            <p className="text-xs text-dark-400 pt-2">
              Password changes are managed through Supabase Auth. Please use
              the forgot password option to reset your password.
            </p>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-primary-400" />
            <h2 className="text-xl font-bold">Notifications</h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-dark-300">
              Notification settings coming soon. You can manage your preferences
              here in the future.
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-700/50 bg-red-900/10">
          <div className="flex items-center gap-3 mb-6">
            <LogOut className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-bold text-red-400">Account Actions</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sign Out</p>
                <p className="text-sm text-dark-300">
                  Sign out of your account
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Back to Profile */}
        <div className="mt-6">
          <Link href="/profile">
            <Button variant="secondary">Back to Profile</Button>
          </Link>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleProfileUpdate}
        currentUsername={profile.username}
        currentAvatarUrl={profile.avatarUrl}
        currentBio={profile.bio}
      />
    </div>
  )
}

