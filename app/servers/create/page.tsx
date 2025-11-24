'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/app/providers'
import { useToast } from '@/components/ui/Toast'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function CreateServerPage() {
  const router = useRouter()
  const { user, isConfigured, loading: authLoading } = useAuth()
  const { showToast, ToastComponent } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    connectUrl: '',
    description: '',
    tags: '',
    features: '',
  })

  useEffect(() => {
    if (!authLoading && (!user || !isConfigured)) {
      router.push('/auth/signin')
    }
  }, [user, isConfigured, authLoading, router])

  if (authLoading || !user || !isConfigured) {
    return null
  }

  const handleLogoUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      showToast('Please upload a valid image file (JPEG, PNG, WebP, or GIF)', 'error')
      return
    }

    // Validate file size (5MB max for logos)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      showToast('Logo file size must be less than 5MB', 'error')
      return
    }

    setUploadingLogo(true)
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

      setLogoUrl(urlData.publicUrl)
      showToast('Logo uploaded successfully!', 'success')
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      showToast(error.message || 'Failed to upload logo', 'error')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleLogoUpload(file)
    }
  }

  const removeLogo = () => {
    setLogoUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
      
      const features = formData.features
        .split(',')
        .map((feature) => feature.trim())
        .filter((feature) => feature.length > 0)

      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          connectUrl: formData.connectUrl || null,
          logoUrl: logoUrl || null,
          description: formData.description || null,
          tags,
          features: features.length > 0 ? features : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create server listing')
      }

      showToast('Server listing created successfully! It will be reviewed by an admin.', 'success')
      setTimeout(() => {
        router.push('/servers')
      }, 1500)
    } catch (error: any) {
      console.error('Error creating server:', error)
      showToast(error.message || 'Failed to create server listing', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/servers">
          <Button variant="secondary" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Servers
          </Button>
        </Link>

        <div className="card">
          <h1 className="text-3xl font-bold mb-6">List Your Server</h1>
          <p className="text-dark-400 mb-6">
            Share your FiveM server with the community. Your listing will be reviewed by an admin before going live.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Server Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                required
                placeholder="Los Santos Roleplay"
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="logo" className="block text-sm font-medium mb-2">
                Server Logo
              </label>
              {logoUrl ? (
                <div className="relative inline-block">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-dark-700">
                    <Image
                      src={logoUrl}
                      alt="Server logo"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-dark-700 rounded-lg p-6 text-center">
                  <input
                    id="logo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                  <label
                    htmlFor="logo"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <ImageIcon className="w-8 h-8 text-dark-400" />
                    <span className="text-sm text-dark-400">
                      {uploadingLogo ? 'Uploading...' : 'Click to upload logo'}
                    </span>
                    <span className="text-xs text-dark-500">
                      JPEG, PNG, WebP, or GIF (max 5MB)
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="connectUrl" className="block text-sm font-medium mb-2">
                Connect URL (FiveM)
              </label>
              <input
                id="connectUrl"
                type="text"
                value={formData.connectUrl}
                onChange={(e) => setFormData({ ...formData, connectUrl: e.target.value })}
                className="input w-full"
                placeholder="fivem://connect/server.example.com"
              />
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
                placeholder="Tell us about your server..."
                maxLength={1000}
              />
              <p className="text-xs text-dark-400 mt-1">
                {formData.description.length}/1000 characters
              </p>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-2">
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="input w-full"
                placeholder="roleplay, economy, custom-scripts"
              />
              <p className="text-xs text-dark-400 mt-1">
                Separate tags with commas
              </p>
            </div>

            <div>
              <label htmlFor="features" className="block text-sm font-medium mb-2">
                Features (comma-separated)
              </label>
              <input
                id="features"
                type="text"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="input w-full"
                placeholder="Custom Scripts, Active Staff, Economy System"
              />
              <p className="text-xs text-dark-400 mt-1">
                Separate features with commas
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Server Listing'}
              </Button>
              <Link href="/servers">
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

