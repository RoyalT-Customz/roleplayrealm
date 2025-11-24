'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Post {
  id: string
  media: any
  _count: {
    likes: number
  }
}

export function TrendingClips() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/posts?limit=6')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch posts')
        }
        return res.json()
      })
      .then((data) => {
        // Ensure posts is an array
        const postsArray = Array.isArray(data.posts) ? data.posts : []
        // Filter posts with video media
        const videoPosts = postsArray.filter((post: Post) => {
          if (!post.media || !Array.isArray(post.media)) return false
          return post.media.some((item: any) => item.type === 'video')
        })
        setPosts(videoPosts.slice(0, 6))
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching trending clips:', error)
        setPosts([])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="text-dark-400">Loading trending clips...</div>
  }

  if (posts.length === 0) {
    return <div className="text-dark-400">No clips yet</div>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {posts.map((post) => {
        const videoItem = post.media?.find((item: any) => item.type === 'video')
        return (
          <Link key={post.id} href={`/posts/${post.id}`}>
            <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-dark-800 group cursor-pointer">
              {videoItem?.thumbnail ? (
                <Image
                  src={videoItem.thumbnail}
                  alt="Video thumbnail"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <video
                  src={videoItem?.url}
                  className="w-full h-full object-cover"
                  muted
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <div className="flex items-center gap-1 text-white text-sm">
                  <span>❤️</span>
                  <span>{post._count.likes}</span>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

