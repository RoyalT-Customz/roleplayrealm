'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, MessageCircle, Share2, MoreVertical, ThumbsDown, Smile, Edit, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime } from '@/lib/utils'
import { useAuth } from '@/app/providers'
import { useToast } from '@/components/ui/Toast'
import { EditPostModal } from './EditPostModal'

interface PostCardProps {
  post: {
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
  onPostDeleted?: () => void
  onPostUpdated?: () => void
}

const EMOJI_OPTIONS = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'laugh', emoji: '😂', label: 'Laugh' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😠', label: 'Angry' },
]

export function PostCard({ post, onPostDeleted, onPostUpdated }: PostCardProps) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post._count.likes)
  const [currentReaction, setCurrentReaction] = useState<string | null>(null)
  const [reactionCount, setReactionCount] = useState(post._count.reactions || 0)
  const [disliked, setDisliked] = useState(false)
  const [dislikeCount, setDislikeCount] = useState(post._count.dislikes || 0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { showToast, ToastComponent } = useToast()

  // Fetch current user's database ID and admin status
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

  const isAuthor = currentUserId && post.author.id === currentUserId
  const canDelete = isAuthor || isAdmin
  const canEdit = isAuthor

  // Fetch user's reaction and dislike status on mount
  useEffect(() => {
    if (!user) return

    const fetchStatus = async () => {
      try {
        const [reactionRes, dislikeRes] = await Promise.all([
          fetch(`/api/posts/${post.id}/reaction`),
          fetch(`/api/posts/${post.id}/dislike`),
        ])

        if (reactionRes.ok) {
          const reactionData = await reactionRes.json()
          setCurrentReaction(reactionData.reaction)
        }

        if (dislikeRes.ok) {
          const dislikeData = await dislikeRes.json()
          setDisliked(dislikeData.disliked)
        }
      } catch (error) {
        console.error('Error fetching reaction/dislike status:', error)
      }
    }

    fetchStatus()
  }, [user, post.id])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showEmojiPicker || showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker, showMenu])

  const handleLike = async () => {
    if (!user) return

    try {
      const method = liked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/posts/${post.id}/like`, { method })

      if (response.ok) {
        setLiked(!liked)
        setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleReaction = async (emojiType: string) => {
    if (!user) return

    try {
      // If clicking the same reaction, remove it
      if (currentReaction === emojiType) {
        const response = await fetch(`/api/posts/${post.id}/reaction`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setCurrentReaction(null)
          setReactionCount((prev) => Math.max(0, prev - 1))
          setShowEmojiPicker(false)
        }
      } else {
        // Add or update reaction
        const response = await fetch(`/api/posts/${post.id}/reaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji: emojiType }),
        })

        if (response.ok) {
          // If there was a previous reaction, don't increment count
          if (!currentReaction) {
            setReactionCount((prev) => prev + 1)
          }
          setCurrentReaction(emojiType)
          setShowEmojiPicker(false)
          // Remove dislike if user reacts
          if (disliked) {
            setDisliked(false)
            setDislikeCount((prev) => Math.max(0, prev - 1))
          }
        }
      }
    } catch (error) {
      console.error('Error reacting to post:', error)
    }
  }

  const handleDislike = async () => {
    if (!user) return

    try {
      const method = disliked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/posts/${post.id}/dislike`, { method })

      if (response.ok) {
        const newDisliked = !disliked
        setDisliked(newDisliked)
        setDislikeCount((prev) => (newDisliked ? prev + 1 : Math.max(0, prev - 1)))
        
        // Remove reaction if user dislikes
        if (newDisliked && currentReaction) {
          setCurrentReaction(null)
          setReactionCount((prev) => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error disliking post:', error)
    }
  }

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`
    
    // Try Web Share API first (mobile/supported browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.author.username}'s post on Roleplay Realm`,
          text: post.content || 'Check out this post!',
          url: postUrl,
        })
        showToast('Shared successfully!', 'success')
        return
      } catch (error: any) {
        // User cancelled or share failed, fall back to clipboard
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(postUrl)
      showToast('Link copied to clipboard!', 'success')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      showToast('Failed to share. Please copy the URL manually.', 'error')
    }
  }

  const handleDelete = async () => {
    const confirmMessage = isAdmin && !isAuthor
      ? `Are you sure you want to delete this post as an admin? This action cannot be undone.`
      : 'Are you sure you want to delete this post? This action cannot be undone.'
    
    if (!confirm(confirmMessage)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete post')
      }

      showToast('Post deleted successfully', 'success')
      if (onPostDeleted) {
        onPostDeleted()
      }
    } catch (error: any) {
      console.error('Error deleting post:', error)
      showToast(error.message || 'Failed to delete post', 'error')
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  const handleEdit = () => {
    setShowEditModal(true)
    setShowMenu(false)
  }

  const media = post.media && Array.isArray(post.media) ? post.media : []
  
  // Debug: log media data
  if (media.length > 0 && process.env.NODE_ENV === 'development') {
    console.log('Post media:', media)
  }

  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <Link href={`/profile/${post.author.username}`}>
          <Avatar src={post.author.avatarUrl} alt={post.author.username} />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.author.username}`}
                className="font-semibold hover:text-primary-400"
              >
                {post.author.username}
              </Link>
              <span className="text-dark-400 text-sm">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            {canDelete && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
                  disabled={isDeleting}
                >
                  <MoreVertical className="w-5 h-5 text-dark-400" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                    {canEdit && (
                      <button
                        onClick={handleEdit}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-dark-700 transition-colors text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-dark-700 transition-colors text-sm text-red-400 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {isDeleting ? 'Deleting...' : isAdmin && !isAuthor ? 'Delete (Admin)' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {post.content && (
            <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
          )}

          {media.length > 0 && (
            <div className="mb-4 space-y-2">
              {media.map((item: any, idx: number) => (
                <div key={idx} className="rounded-lg overflow-hidden">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={post.content || 'Post image'}
                      className="w-full h-auto rounded-lg"
                      onError={(e) => {
                        console.error('Image load error:', item.url)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <video
                      src={item.url}
                      controls
                      className="w-full max-h-96 rounded-lg"
                      poster={item.thumbnail}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?tags=${tag}`}
                  className="text-primary-400 hover:text-primary-300 text-sm"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 pt-4 border-t border-dark-700">
            {/* Emoji Reactions */}
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={!user}
                className={`flex items-center gap-2 hover:text-primary-400 transition-colors ${
                  currentReaction ? 'text-primary-500' : 'text-dark-400'
                }`}
              >
                {currentReaction ? (
                  <span className="text-xl">
                    {EMOJI_OPTIONS.find((e) => e.type === currentReaction)?.emoji}
                  </span>
                ) : (
                  <Smile className="w-5 h-5" />
                )}
                {reactionCount > 0 && <span>{reactionCount}</span>}
              </button>

              {showEmojiPicker && user && (
                <div className="absolute bottom-full left-0 mb-2 bg-dark-800 border border-dark-700 rounded-lg p-2 shadow-lg z-10 flex gap-1">
                  {EMOJI_OPTIONS.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => handleReaction(option.type)}
                      className={`p-2 rounded hover:bg-dark-700 transition-colors text-xl ${
                        currentReaction === option.type ? 'bg-dark-700' : ''
                      }`}
                      title={option.label}
                    >
                      {option.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Like Button (keeping for backward compatibility) */}
            <button
              onClick={handleLike}
              disabled={!user}
              className={`flex items-center gap-2 hover:text-primary-400 transition-colors ${
                liked ? 'text-primary-500' : 'text-dark-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>

            {/* Dislike Button */}
            <button
              onClick={handleDislike}
              disabled={!user}
              className={`flex items-center gap-2 hover:text-red-400 transition-colors ${
                disliked ? 'text-red-500' : 'text-dark-400'
              }`}
            >
              <ThumbsDown className={`w-5 h-5 ${disliked ? 'fill-current' : ''}`} />
              {dislikeCount > 0 && <span>{dislikeCount}</span>}
            </button>

            <Link
              href={`/posts/${post.id}`}
              className="flex items-center gap-2 text-dark-400 hover:text-primary-400 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post._count.comments}</span>
            </Link>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-dark-400 hover:text-primary-400 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {ToastComponent}
      {showEditModal && (
        <EditPostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            if (onPostUpdated) {
              onPostUpdated()
            }
          }}
          post={post}
        />
      )}
    </div>
  )
}

