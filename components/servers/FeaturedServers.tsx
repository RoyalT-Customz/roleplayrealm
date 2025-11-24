'use client'

import { useEffect, useState } from 'react'
import { ServerCard } from './ServerCard'

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

export function FeaturedServers() {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/servers?featured=true&limit=6')
      .then((res) => res.json())
      .then((data) => {
        setServers(data.servers)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-dark-400">Loading featured servers...</div>
  }

  if (servers.length === 0) {
    return <div className="text-dark-400">No featured servers yet</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {servers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </div>
  )
}

