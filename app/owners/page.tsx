'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Shield, Trash2, Edit, Star, Ban, User } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

const OWNER_EMAIL = 'kingroyalt.vu@gmail.com'

interface AdminActivity {
  id: string
  action: string
  targetType: string | null
  targetId: string | null
  metadata: any
  createdAt: string
  user: {
    id: string
    email: string
    username: string
  }
}

interface Admin {
  id: string
  email: string
  username: string
}

export default function OwnersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.email !== OWNER_EMAIL) {
        router.push('/')
        return
      }
      fetchAdminActivity()
    }
  }, [user, authLoading, router, page])

  const fetchAdminActivity = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/owners/admin-activity?page=${page}&limit=50`)

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch admin activity')
      }

      const data = await response.json()
      setActivities(data.activities || [])
      setAdmins(data.admins || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching admin activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'post_deleted':
      case 'marketplace_listing_deleted':
        return <Trash2 className="w-4 h-4 text-red-400" />
      case 'post_edited':
      case 'marketplace_listing_edited':
        return <Edit className="w-4 h-4 text-yellow-400" />
      case 'server_featured':
        return <Star className="w-4 h-4 text-primary-400" />
      case 'server_unfeatured':
        return <Star className="w-4 h-4 text-dark-400" />
      case 'user_banned':
        return <Ban className="w-4 h-4 text-red-400" />
      case 'user_unbanned':
        return <User className="w-4 h-4 text-green-400" />
      default:
        return <Shield className="w-4 h-4 text-primary-400" />
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'post_deleted':
        return 'Deleted Post'
      case 'post_edited':
        return 'Edited Post'
      case 'marketplace_listing_deleted':
        return 'Deleted Marketplace Listing'
      case 'marketplace_listing_edited':
        return 'Edited Marketplace Listing'
      case 'server_featured':
        return 'Featured Server'
      case 'server_unfeatured':
        return 'Unfeatured Server'
      case 'user_banned':
        return 'Banned User'
      case 'user_unbanned':
        return 'Unbanned User'
      default:
        return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user || user.email !== OWNER_EMAIL) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary-400" />
            Owners Dashboard
          </h1>
          <p className="text-dark-400">
            Monitor admin activity and ensure proper use of privileges
          </p>
        </div>

        {/* Admin List */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-4">Active Admins</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="p-4 bg-dark-700 rounded-lg border border-dark-600"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-primary-400" />
                  <span className="font-semibold">{admin.username}</span>
                </div>
                <p className="text-sm text-dark-400">{admin.email}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Logs */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Admin Activity Log</h2>

          {activities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-dark-400">No admin activity recorded yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 bg-dark-700 rounded-lg border border-dark-600"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{getActionIcon(activity.action)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">
                            {activity.user.username}
                          </span>
                          <span className="text-dark-400">•</span>
                          <span className="text-sm text-dark-400">
                            {getActionLabel(activity.action)}
                          </span>
                        </div>
                        {activity.metadata && (
                          <div className="text-sm text-dark-300 mb-2">
                            {activity.metadata.description || activity.metadata.reason || ''}
                          </div>
                        )}
                        {activity.targetType && activity.targetId && (
                          <div className="text-xs text-dark-500">
                            Target: {activity.targetType} ({activity.targetId})
                          </div>
                        )}
                        <div className="text-xs text-dark-500 mt-2">
                          {formatRelativeTime(activity.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-dark-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-dark-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-dark-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

