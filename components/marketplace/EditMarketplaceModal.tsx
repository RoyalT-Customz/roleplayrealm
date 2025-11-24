'use client'

import { useState, useEffect } from 'react'
import { Image as ImageIcon, Video, X, Hash } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { useToast } from '@/components/ui/Toast'

interface EditMarketplaceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  listing: {
    id: string
    title: string
    description: string | null
    category: string
    price: number | null
    media: any
    tags: string[]
    tebexLink: string | null
  }
}

export function EditMarketplaceModal({
  isOpen,
  onClose,
  onSuccess,
  listing,
}: EditMarketplaceModalProps) {
  const { user, isConfigured } = useAuth()
  const { showToast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState(listing.title || '')
  const [description, setDescription] = useState(listing.description || '')
  const [category, setCategory] = useState(listing.category || '')
  const [price, setPrice] = useState(listing.price?.toString() || '')
  const [tebexLink, setTebexLink] = useState(listing.tebexLink || '')
  const [tags, setTags] = useState<string[]>(listing.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [media, setMedia] = useState<any[]>(
    listing.media && Array.isArray(listing.media) ? listing.media : []
  )

  const categories = ['script', 'asset', 'vehicle', 'map', 'other']

  // Update state when listing changes
  useEffect(() => {
    if (listing) {
      setContent(listing.title || '')
      setDescription(listing.description || '')
      setCategory(listing.category || '')
      setPrice(listing.price?.toString() || '')
      setTebexLink(listing.tebexLink || '')
      setTags(listing.tags || [])
      setMedia(listing.media && Array.isArray(listing.media) ? listing.media : [])
    }
  }, [listing])

  if (!isConfigured || !user) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Listing" size="lg">
        <div className="text-center py-8">
          <p className="text-dark-300 mb-4">You need to sign in to edit a listing.</p>
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

      const { data: urlData } = supabase.storage
        .from(bucket || 'uploads')
        .getPublicUrl(path)

      const mediaItem = {
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: urlData.publicUrl,
      }

      setMedia((prev) => [...prev, mediaItem])
      showToast('Media uploaded successfully!', 'success')
    } catch (error: any) {
      console.error('Error uploading file:', error)
      showToast(error.message || 'Failed to upload file', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/marketplace/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: content.trim(),
          description: description.trim() || null,
          category,
          price: price ? parseFloat(price) : null,
          media: media.length > 0 ? media : null,
          tags,
          tebexLink: tebexLink.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to update listing'
        
        if (response.status === 401) {
          throw new Error('Please sign in to edit a listing.')
        } else if (response.status === 403) {
          throw new Error('You do not have permission to edit this listing.')
        } else {
          throw new Error(errorMessage)
        }
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error updating listing:', error)
      showToast(error.message || 'Failed to update listing. Please try again.', 'error')
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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Listing" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Product Title <span className="text-red-400">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input w-full"
            required
            placeholder="Custom Police Script"
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            Category <span className="text-red-400">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input w-full"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input w-full min-h-[120px] resize-none"
            placeholder="Describe your product..."
            maxLength={1000}
          />
          <p className="text-xs text-dark-400 mt-1">
            {description.length}/1000 characters
          </p>
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-2">
            Price (USD)
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input w-full"
            placeholder="0.00 (leave empty for free)"
          />
          <p className="text-xs text-dark-400 mt-1">
            Leave empty if the product is free
          </p>
        </div>

        <div>
          <label htmlFor="tebexLink" className="block text-sm font-medium mb-2">
            Tebex Store Link <span className="text-primary-400">*</span>
          </label>
          <input
            id="tebexLink"
            type="url"
            value={tebexLink}
            onChange={(e) => setTebexLink(e.target.value)}
            className="input w-full"
            placeholder="https://yourstore.tebex.io/package/123456"
            required
          />
          <p className="text-xs text-dark-400 mt-1">
            Link to your Tebex store where customers can purchase this product
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Media (Images/Videos)
          </label>
          {media.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {media.map((item, idx) => (
                <div key={idx} className="relative">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`Media ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={item.url}
                      className="w-full h-32 object-cover rounded-lg"
                      controls
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setMedia(media.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white"
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
          {uploading && (
            <p className="text-xs text-dark-400 mt-2">Uploading...</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tags</label>
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
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

