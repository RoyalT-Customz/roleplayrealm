'use client'

import { useState, useEffect } from 'react'
import { X, Image as ImageIcon, Upload } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { createSupabaseClient } from '@/lib/supabase/client'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentUsername: string
  currentAvatarUrl?: string | null
  currentBio?: string | null
}

export function EditProfileModal({
  isOpen,
  onClose,
  onSuccess,
  currentUsername,
  currentAvatarUrl,
  currentBio,
}: EditProfileModalProps) {
  const [username, setUsername] = useState(currentUsername)
  const [bio, setBio] = useState(currentBio || '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl || null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens/closes or props change
  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername)
      setBio(currentBio || '')
      setAvatarUrl(currentAvatarUrl || null)
      setAvatarPreview(currentAvatarUrl || null)
      setError(null)
    }
  }, [isOpen, currentUsername, currentAvatarUrl, currentBio])

  const handleAvatarUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB for profile images)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)

      // Get upload path
      const uploadResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          bucket: 'uploads',
        }),
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get upload URL')
      }

      const { path, bucket } = await uploadResponse.json()

      // Upload directly to Supabase Storage
      const supabase = createSupabaseClient()
      const { data, error: uploadError } = await supabase.storage
        .from(bucket || 'uploads')
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket || 'uploads')
        .getPublicUrl(path)

      setAvatarUrl(urlData.publicUrl)
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      setError(`Failed to upload image: ${error.message || 'Unknown error'}`)
      setAvatarPreview(currentAvatarUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl(null)
    setAvatarPreview(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Validate username
      if (!username || username.trim().length === 0) {
        setError('Username cannot be empty')
        setSaving(false)
        return
      }

      if (username.length < 3 || username.length > 30) {
        setError('Username must be between 3 and 30 characters')
        setSaving(false)
        return
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        setError('Username can only contain letters, numbers, underscores, and hyphens')
        setSaving(false)
        return
      }

      if (bio && bio.length > 500) {
        setError('Bio must be less than 500 characters')
        setSaving(false)
        return
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          avatarUrl,
          bio: bio.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to update profile'
        
        if (response.status === 409) {
          setError('Username is already taken. Please choose another.')
        } else if (response.status === 400) {
          setError(errorMessage)
        } else {
          setError('Failed to update profile. Please try again.')
        }
        setSaving(false)
        return
      }

      // Success - close modal and refresh profile
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar
              src={avatarPreview || undefined}
              alt={username}
              size="xl"
              className="w-24 h-24"
            />
            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                title="Remove avatar"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
          
          <label className="flex items-center gap-2 px-4 py-2 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-sm">
              {uploading ? 'Uploading...' : avatarPreview ? 'Change Photo' : 'Upload Photo'}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAvatarUpload(file)
              }}
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-dark-400 text-center">
            JPG, PNG, WebP or GIF. Max 5MB
          </p>
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError(null)
            }}
            placeholder="Enter username"
            className="input w-full"
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_-]+"
          />
          <p className="text-xs text-dark-400 mt-1">
            3-30 characters. Letters, numbers, underscores, and hyphens only.
          </p>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => {
              setBio(e.target.value)
              setError(null)
            }}
            placeholder="Tell us about yourself..."
            className="input w-full min-h-[100px] resize-none"
            maxLength={500}
            rows={4}
          />
          <p className="text-xs text-dark-400 mt-1">
            {bio.length}/500 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-4 border-t border-dark-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving || uploading}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || uploading}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

