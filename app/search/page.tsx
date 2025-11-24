'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PostCard } from '@/components/feed/PostCard'
import { ServerCard } from '@/components/servers/ServerCard'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      // Auto-search if query param exists
      handleSearch(q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSearch()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Search</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts, servers, marketplace..."
            className="input flex-1"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {results && (
        <div className="space-y-8">
          {results.posts && results.posts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Posts</h2>
              <div className="space-y-6">
                {results.posts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {results.servers && results.servers.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Servers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.servers.map((server: any) => (
                  <ServerCard key={server.id} server={server} />
                ))}
              </div>
            </div>
          )}

          {results.marketplace && results.marketplace.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Marketplace</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.marketplace.map((item: any) => (
                  <div key={item.id} className="card">
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-dark-400 mb-4">{item.description}</p>
                    <div className="text-primary-400 font-bold">
                      {item.price === null ? 'Free' : `$${item.price.toFixed(2)}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results &&
            (!results.posts || results.posts.length === 0) &&
            (!results.servers || results.servers.length === 0) &&
            (!results.marketplace || results.marketplace.length === 0) && (
              <div className="text-center py-12">
                <p className="text-dark-400">No results found</p>
              </div>
            )}
        </div>
      )}
    </div>
  )
}

