'use client'

import { useState } from 'react'
import { X, Image as ImageIcon, Video, Hash } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreatePostModal({ isOpen, onClose, onSuccess }: CreatePostModalProps) {
  const { user, isConfigured } = useAuth()
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [media, setMedia] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Check if user is signed in
  if (!isConfigured || !user) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create Post" size="lg">
        <div className="text-center py-8">
          <p className="text-dark-300 mb-4">You need to sign in to create a post.</p>
          <Button onClick={() => window.location.href = '/auth/signin'}>
            Sign In
          </Button>
        </div>
      </Modal>
    )
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      // Get upload path
      const uploadResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      })

      const { path, bucket } = await uploadResponse.json()

      // Upload directly to Supabase Storage
      const supabase = createSupabaseClient()
      const { data, error } = await supabase.storage
        .from(bucket || 'uploads')
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        })

      if (error) {
        throw new Error(error.message)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket || 'uploads')
        .getPublicUrl(path)

      const mediaItem = {
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: urlData.publicUrl,
      }

      setMedia((prev) => [...prev, mediaItem])
    } catch (error: any) {
      console.error('Error uploading file:', error)
      alert(`Failed to upload file: ${error.message || 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim() || null,
          media: media.length > 0 ? media : null,
          tags,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to create post'
        
        // Provide more helpful error messages
        if (response.status === 401) {
          throw new Error('Please sign in to create a post. Redirecting to sign in...')
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment before posting again.')
        } else {
          throw new Error(errorMessage)
        }
      }

      // Reset form
      setContent('')
      setTags([])
      setTagInput('')
      setMedia([])
      onSuccess()
    } catch (error: any) {
      console.error('Error creating post:', error)
      const errorMsg = error.message || 'Failed to create post. Make sure you are signed in and the database is set up.'
      alert(errorMsg)
      
      // Redirect to sign in if unauthorized
      if (errorMsg.includes('sign in')) {
        setTimeout(() => {
          window.location.href = '/auth/signin'
        }, 1500)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().replace('#', '')
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Post" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="input min-h-[120px] resize-none"
            rows={5}
          />
        </div>

        {media.length > 0 && (
          <div className="space-y-2">
            {media.map((item, idx) => (
              <div key={idx} className="relative">
                {item.type === 'image' ? (
                  <img 
                    src={item.url} 
                    alt={`Upload ${idx + 1}`} 
                    className="rounded-lg max-h-64 w-full object-cover"
                    onError={(e) => {
                      console.error('Preview image error:', item.url)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <video src={item.url} controls className="rounded-lg max-h-64" />
                )}
                <button
                  type="button"
                  onClick={() => setMedia(media.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 p-1 bg-dark-900 rounded-full hover:bg-dark-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 transition-colors">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm">Image</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              disabled={uploading}
            />
          </label>

          <label className="flex items-center gap-2 px-4 py-2 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 transition-colors">
            <Video className="w-4 h-4" />
            <span className="text-sm">Video</span>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              disabled={uploading}
            />
          </label>
        </div>

        <div>
          <div className="flex gap-2 mb-2">
            <div className="flex-1 flex items-center gap-2 input">
              <Hash className="w-4 h-4 text-dark-400" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Add tags"
                className="flex-1 bg-transparent border-none outline-none"
              />
            </div>
            <Button type="button" onClick={addTag} variant="secondary">
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-900/30 text-primary-400 rounded text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-primary-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || uploading}>
            {submitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

