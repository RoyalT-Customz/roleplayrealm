'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { Settings, Edit } from 'lucide-react'
import Link from 'next/link'

interface ProfileData {
  id: string
  email: string
  username: string
  avatarUrl?: string | null
  bannerUrl?: string | null
  bio?: string | null
  isAdmin: boolean
  badges?: any
  createdAt: string
  updatedAt: string
  stats: {
    posts: number
    servers: number
    followers: number
    following: number
  }
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
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
    // Refresh profile data after successful update
    fetchProfile()
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
        <div className="card mb-6">
          <div className="flex items-start gap-6">
            <Avatar size="xl" src={profile.avatarUrl || undefined} alt={profile.username} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{profile.username}</h1>
                  {profile.bio && <p className="text-dark-300">{profile.bio}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Link href="/settings">
                    <Button variant="secondary">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Posts</h2>
            <p className="text-3xl font-bold text-primary-400">{profile.stats.posts}</p>
          </div>
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Servers</h2>
            <p className="text-3xl font-bold text-primary-400">{profile.stats.servers}</p>
          </div>
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Followers</h2>
            <p className="text-3xl font-bold text-primary-400">{profile.stats.followers}</p>
          </div>
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

