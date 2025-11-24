'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ServerCard } from '@/components/servers/ServerCard'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { useAuth } from '@/app/providers'

interface Server {
  id: string
  name: string
  logoUrl: string | null
  description: string | null
  upvotes: number
  tags: string[]
  owner: {
    username: string
  }
}

export default function ServersPage() {
  const { user } = useAuth()
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchServers()
  }, [])

  const fetchServers = async (pageNum: number = 1) => {
    try {
      const response = await fetch(`/api/servers?page=${pageNum}&limit=20`)
      const data = await response.json()
      
      if (pageNum === 1) {
        setServers(data.servers)
      } else {
        setServers((prev) => [...prev, ...data.servers])
      }
      
      setHasMore(data.pagination.page < data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchServers(nextPage)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Server Listings</h1>
        {user && (
          <Link href="/servers/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              List Your Server
            </Button>
          </Link>
        )}
      </div>

      {loading && servers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-dark-400">Loading servers...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {servers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}

          {servers.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-dark-400">No servers found</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

