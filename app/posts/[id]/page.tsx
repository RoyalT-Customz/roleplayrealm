'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Heart, MessageCircle, Share2, ArrowLeft, Send, ThumbsDown, Smile, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { EditPostModal } from '@/components/feed/EditPostModal'

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    username: string
    avatarUrl: string | null
  }
}

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

export default function PostPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isConfigured } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [currentReaction, setCurrentReaction] = useState<string | null>(null)
  const [reactionCount, setReactionCount] = useState(0)
  const [disliked, setDisliked] = useState(false)
  const [dislikeCount, setDislikeCount] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const postId = params.id as string
  const { showToast, ToastComponent } = useToast()

  // Fetch current user's database ID and admin status
  useEffect(() => {
    if (user && isConfigured) {
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
  }, [user, isConfigured])

  const isAuthor = currentUserId && post && post.author.id === currentUserId
  const canDelete = isAuthor || isAdmin
  const canEdit = isAuthor

  const EMOJI_OPTIONS = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'laugh', emoji: '😂', label: 'Laugh' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😠', label: 'Angry' },
  ]

  useEffect(() => {
    if (postId) {
      fetchPost()
      fetchComments()
    }
  }, [postId])

  // Close emoji picker and menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false)
      }
      if (showMenu && !target.closest('.post-menu-container')) {
        setShowMenu(false)
      }
    }

    if (showEmojiPicker || showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker, showMenu])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/posts/${postId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch post')
      }

      const data = await response.json()
      setPost(data)
      setLikeCount(data._count.likes)
      setReactionCount(data._count.reactions || 0)
      setDislikeCount(data._count.dislikes || 0)
      
      // Check if user liked/reacted/disliked this post
      if (user && isConfigured) {
        checkLiked()
        checkReaction()
        checkDisliked()
      }
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkLiked = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`)
      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked || false)
      }
    } catch (error) {
      // Ignore errors - just means user hasn't liked it
    }
  }

  const checkReaction = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/reaction`)
      if (response.ok) {
        const data = await response.json()
        setCurrentReaction(data.reaction)
      }
    } catch (error) {
      // Ignore errors
    }
  }

  const checkDisliked = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/dislike`)
      if (response.ok) {
        const data = await response.json()
        setDisliked(data.disliked || false)
      }
    } catch (error) {
      // Ignore errors
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleLike = async () => {
    if (!user || !isConfigured) {
      router.push('/auth/signin')
      return
    }

    try {
      const method = liked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/posts/${postId}/like`, { method })

      if (response.ok) {
        setLiked(!liked)
        setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleReaction = async (emojiType: string) => {
    if (!user || !isConfigured) {
      router.push('/auth/signin')
      return
    }

    try {
      if (currentReaction === emojiType) {
        const response = await fetch(`/api/posts/${postId}/reaction`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setCurrentReaction(null)
          setReactionCount((prev) => Math.max(0, prev - 1))
          setShowEmojiPicker(false)
        }
      } else {
        const response = await fetch(`/api/posts/${postId}/reaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji: emojiType }),
        })

        if (response.ok) {
          if (!currentReaction) {
            setReactionCount((prev) => prev + 1)
          }
          setCurrentReaction(emojiType)
          setShowEmojiPicker(false)
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
    if (!user || !isConfigured) {
      router.push('/auth/signin')
      return
    }

    try {
      const method = disliked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/posts/${postId}/dislike`, { method })

      if (response.ok) {
        const newDisliked = !disliked
        setDisliked(newDisliked)
        setDislikeCount((prev) => (newDisliked ? prev + 1 : Math.max(0, prev - 1)))
        
        if (newDisliked && currentReaction) {
          setCurrentReaction(null)
          setReactionCount((prev) => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error disliking post:', error)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !isConfigured) {
      router.push('/auth/signin')
      return
    }

    if (!commentText.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin')
          return
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create comment')
      }

      const newComment = await response.json()
      setComments((prev) => [newComment, ...prev])
      setCommentText('')
      
      // Update comment count
      if (post) {
        setPost({
          ...post,
          _count: {
            ...post._count,
            comments: post._count.comments + 1,
          },
        })
      }
    } catch (error: any) {
      console.error('Error creating comment:', error)
      alert(error.message || 'Failed to create comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${postId}`
    
    // Try Web Share API first (mobile/supported browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post?.author.username}'s post on Roleplay Realm`,
          text: post?.content || 'Check out this post!',
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
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete post')
      }

      showToast('Post deleted successfully', 'success')
      // Redirect to home after deletion
      setTimeout(() => {
        router.push('/')
      }, 1000)
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-dark-300 mb-4">Post not found</p>
          <Link href="/">
            <Button variant="secondary">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const media = post.media && Array.isArray(post.media) ? post.media : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/">
          <Button variant="secondary" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Button>
        </Link>

        {/* Post */}
        <div className="card mb-6">
          <div className="flex items-start gap-4">
            <Link href={`/profile/${post.author.username}`}>
              <Avatar
                src={post.author.avatarUrl || undefined}
                alt={post.author.username}
              />
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
                  <div className="relative post-menu-container">
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
                <div className="relative emoji-picker-container">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={!user || !isConfigured}
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

                  {showEmojiPicker && user && isConfigured && (
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

                {/* Like Button */}
                <button
                  onClick={handleLike}
                  disabled={!user || !isConfigured}
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
                  disabled={!user || !isConfigured}
                  className={`flex items-center gap-2 hover:text-red-400 transition-colors ${
                    disliked ? 'text-red-500' : 'text-dark-400'
                  }`}
                >
                  <ThumbsDown className={`w-5 h-5 ${disliked ? 'fill-current' : ''}`} />
                  {dislikeCount > 0 && <span>{dislikeCount}</span>}
                </button>

                <div className="flex items-center gap-2 text-dark-400">
                  <MessageCircle className="w-5 h-5" />
                  <span>{post._count.comments}</span>
                </div>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-dark-400 hover:text-primary-400 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comment Form */}
        {user && isConfigured ? (
          <div className="card mb-6">
            <form onSubmit={handleComment} className="space-y-4">
              <div className="flex gap-4">
                <Avatar
                  src={undefined}
                  alt={user.email || 'User'}
                  size="sm"
                />
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="input min-h-[100px] resize-none w-full"
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-dark-400">
                      {commentText.length}/1000 characters
                    </p>
                    <Button
                      type="submit"
                      disabled={!commentText.trim() || submitting}
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {submitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="card mb-6 text-center py-8">
            <p className="text-dark-300 mb-4">
              Sign in to comment on this post
            </p>
            <Link href="/auth/signin">
              <Button variant="secondary">Sign In</Button>
            </Link>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">
            Comments ({comments.length})
          </h2>
          
          {comments.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-dark-300">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="card">
                <div className="flex items-start gap-4">
                  <Link href={`/profile/${comment.author.username}`}>
                    <Avatar
                      src={comment.author.avatarUrl || undefined}
                      alt={comment.author.username}
                      size="sm"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        href={`/profile/${comment.author.username}`}
                        className="font-semibold hover:text-primary-400"
                      >
                        {comment.author.username}
                      </Link>
                      <span className="text-dark-400 text-sm">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {ToastComponent}
      {showEditModal && post && (
        <EditPostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            // Refresh the post data
            fetchPost()
          }}
          post={post}
        />
      )}
    </div>
  )
}

