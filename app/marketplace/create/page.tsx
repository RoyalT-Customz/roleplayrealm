'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Image as ImageIcon, Video, X, Hash } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/app/providers'
import { useToast } from '@/components/ui/Toast'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function CreateMarketplacePage() {
  const router = useRouter()
  const { user, isConfigured } = useAuth()
  const { showToast, ToastComponent } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [media, setMedia] = useState<any[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    tebexLink: '',
  })

  if (!user || !isConfigured) {
    router.push('/auth/signin')
    return null
  }

  const categories = ['script', 'asset', 'vehicle', 'map', 'other']

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

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

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
      showToast('Media uploaded successfully!', 'success')
    } catch (error: any) {
      console.error('Error uploading file:', error)
      showToast(error.message || 'Failed to upload file', 'error')
    } finally {
      setUploading(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.title || !formData.category) {
        showToast('Title and category are required', 'error')
        setLoading(false)
        return
      }

      const response = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          price: formData.price ? parseFloat(formData.price) : null,
          media: media.length > 0 ? media : null,
          tags,
          tebexLink: formData.tebexLink.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create marketplace listing')
      }

      showToast('Marketplace listing created successfully!', 'success')
      setTimeout(() => {
        router.push('/marketplace')
      }, 1500)
    } catch (error: any) {
      console.error('Error creating marketplace listing:', error)
      showToast(error.message || 'Failed to create marketplace listing', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/marketplace">
          <Button variant="secondary" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link>

        <div className="card">
          <h1 className="text-3xl font-bold mb-6">List Your Product</h1>
          <p className="text-dark-400 mb-6">
            Share your FiveM scripts, assets, vehicles, maps, and more with the community.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Product Title <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full min-h-[120px] resize-none"
                placeholder="Describe your product..."
                maxLength={1000}
              />
              <p className="text-xs text-dark-400 mt-1">
                {formData.description.length}/1000 characters
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
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                value={formData.tebexLink}
                onChange={(e) => setFormData({ ...formData, tebexLink: e.target.value })}
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
              <label className="block text-sm font-medium mb-2">
                Tags
              </label>
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

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || uploading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Listing'}
              </Button>
              <Link href="/marketplace">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
      {ToastComponent}
    </div>
  )
}

