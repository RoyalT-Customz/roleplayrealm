'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowUp, Users, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/app/providers'
import { useToast } from '@/components/ui/Toast'

interface Server {
  id: string
  name: string
  ip: string | null
  connectUrl: string | null
  logoUrl: string | null
  description: string | null
  features: any
  tags: string[]
  trailerUrl: string | null
  screenshots: any
  upvotes: number
  isFeatured: boolean
  status: string
  owner: {
    id: string
    username: string
    avatarUrl: string | null
  }
}

export default function ServerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast, ToastComponent } = useToast()
  const [server, setServer] = useState<Server | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      fetch('/api/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data.id) {
            setCurrentUserId(data.id)
          }
          if (data.isAdmin) {
            setIsAdmin(data.isAdmin)
          }
        })
        .catch(() => {
          // Ignore errors
        })
    }
  }, [user])

  useEffect(() => {
    if (params.id) {
      fetchServer(params.id as string)
    }
  }, [params.id])

  const fetchServer = async (serverId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/servers?id=${serverId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.server) {
          setServer(data.server)
        } else {
          // Fallback: Try admin endpoint if regular endpoint doesn't work
          const adminResponse = await fetch(`/api/admin/servers?limit=1000`)
          if (adminResponse.ok) {
            const adminData = await adminResponse.json()
            const foundServer = adminData.servers?.find((s: Server) => s.id === serverId)
            if (foundServer) {
              setServer(foundServer)
            }
          }
        }
      } else if (response.status === 404) {
        // Server not found
        setServer(null)
      }
    } catch (error) {
      console.error('Error fetching server:', error)
      showToast('Failed to load server details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const deleteServer = async () => {
    if (!server) return

    const confirmMessage = isAdmin
      ? `Are you sure you want to delete "${server.name}"? This action cannot be undone.`
      : `Are you sure you want to delete your server "${server.name}"? This action cannot be undone.`

    if (!confirm(confirmMessage)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/servers?serverId=${server.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast('Server deleted successfully!', 'success')
        router.push('/servers')
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete server')
      }
    } catch (error: any) {
      console.error('Error deleting server:', error)
      showToast(error.message || 'Failed to delete server', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const isOwner = currentUserId && server && server.owner.id === currentUserId
  const canDelete = isOwner || isAdmin
  const canEdit = isOwner

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-dark-400">Loading server details...</div>
        </div>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Server Not Found</h1>
          <p className="text-dark-400 mb-4">The server you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/servers">
            <Button>Back to Servers</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/servers" className="inline-flex items-center gap-2 text-dark-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Servers
      </Link>

      <div className="card">
        <div className="flex items-start gap-6 mb-6">
          {server.logoUrl ? (
            <Image
              src={server.logoUrl}
              alt={server.name}
              width={128}
              height={128}
              className="rounded-lg"
            />
          ) : (
            <div className="w-32 h-32 bg-dark-700 rounded-lg flex items-center justify-center">
              <Users className="w-16 h-16 text-dark-400" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{server.name}</h1>
                <p className="text-dark-400">by {server.owner.username}</p>
              </div>
              {canDelete && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={deleteServer}
                  disabled={isDeleting}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>

            {server.description && (
              <p className="text-dark-300 mb-4">{server.description}</p>
            )}

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1 text-primary-400">
                <ArrowUp className="w-5 h-5" />
                <span className="text-lg font-medium">{server.upvotes}</span>
              </div>
              {server.isFeatured && (
                <span className="px-3 py-1 bg-primary-900/30 text-primary-400 text-sm rounded-full border border-primary-600/30">
                  Featured
                </span>
              )}
              <span className={`px-3 py-1 text-sm rounded ${
                server.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                server.status === 'active' ? 'bg-green-900/30 text-green-400' :
                'bg-red-900/30 text-red-400'
              }`}>
                {server.status}
              </span>
            </div>

            {server.connectUrl && (
              <a
                href={server.connectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-block"
              >
                Connect to Server
              </a>
            )}
          </div>
        </div>

        {server.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {server.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-dark-700 text-sm rounded text-dark-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {server.features && Array.isArray(server.features) && server.features.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">Features</h2>
            <ul className="list-disc list-inside space-y-1 text-dark-300">
              {server.features.map((feature: string, idx: number) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
        )}

        {server.ip && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Server IP</h2>
            <p className="text-dark-300 font-mono">{server.ip}</p>
          </div>
        )}

        {server.trailerUrl && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">Trailer</h2>
            <div className="aspect-video rounded-lg overflow-hidden bg-dark-800">
              <iframe
                src={server.trailerUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {server.screenshots && Array.isArray(server.screenshots) && server.screenshots.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-3">Screenshots</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {server.screenshots.map((screenshot: string, idx: number) => (
                <Image
                  key={idx}
                  src={screenshot}
                  alt={`${server.name} screenshot ${idx + 1}`}
                  width={400}
                  height={300}
                  className="rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {ToastComponent}
    </div>
  )
}

