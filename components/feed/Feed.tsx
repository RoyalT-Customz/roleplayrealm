'use client'

import { useEffect, useState } from 'react'
import { PostCard } from './PostCard'
import { CreatePostModal } from './CreatePostModal'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'

interface Post {
  id: string
  content: string | null
  media: any
  tags: string[]
  createdAt: string
  author: {
    id: string
    username: string
    avatarUrl: string | null
  }
  _count: {
    likes: number
    comments: number
    reactions?: number
    dislikes?: number
  }
}

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchPosts = async (pageNum: number = 1) => {
    try {
      const response = await fetch(`/api/posts?page=${pageNum}&limit=20`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      
      const data = await response.json()
      
      // Ensure posts is always an array
      const postsArray = Array.isArray(data.posts) ? data.posts : []
      
      if (pageNum === 1) {
        setPosts(postsArray)
      } else {
        setPosts((prev) => [...(prev || []), ...postsArray])
      }
      
      if (data.pagination) {
        setHasMore(data.pagination.page < data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      // Ensure posts is always an array even on error
      if (pageNum === 1) {
        setPosts([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchPosts(nextPage)
    }
  }

  if (loading && posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-dark-400">Loading posts...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Feed</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      <div className="space-y-6">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={() => {
                // Remove the deleted post from the list
                setPosts((prev) => prev.filter((p) => p.id !== post.id))
              }}
              onPostUpdated={() => {
                // Refresh the posts to get updated data
                fetchPosts(page)
              }}
            />
          ))
        ) : null}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}

      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-dark-400">No posts yet. Be the first to post!</p>
        </div>
      )}

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          setPage(1)
          fetchPosts(1)
        }}
      />
    </div>
  )
}

