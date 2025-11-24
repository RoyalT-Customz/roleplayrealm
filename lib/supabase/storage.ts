import { createSupabaseClient } from './client'
import { createSupabaseAdmin } from './client'

export type MediaType = 'image' | 'video'

export interface UploadOptions {
  folder?: string
  maxSize?: number // in bytes
  allowedTypes?: string[]
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const DEFAULT_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

/**
 * Get a signed URL for direct client upload to Supabase Storage
 */
export async function getUploadUrl(
  bucket: string,
  path: string,
  fileType: string,
  fileSize: number,
  options: UploadOptions = {}
): Promise<{ url: string; path: string }> {
  const { maxSize = DEFAULT_MAX_SIZE, allowedTypes } = options

  // Validate file size
  if (fileSize > maxSize) {
    throw new Error(`File size exceeds maximum of ${maxSize / 1024 / 1024}MB`)
  }

  // Validate file type
  const validTypes = allowedTypes || [...DEFAULT_IMAGE_TYPES, ...DEFAULT_VIDEO_TYPES]
  if (!validTypes.includes(fileType)) {
    throw new Error(`File type ${fileType} is not allowed`)
  }

  const supabase = createSupabaseAdmin()
  const filePath = `${options.folder || 'uploads'}/${Date.now()}-${path}`

  // Generate a signed URL for upload
  // Note: Supabase Storage uses signed URLs differently
  // For client uploads, we'll return the path and let the client upload directly
  // The client should use the anon key with proper RLS policies
  return { url: '', path: filePath }
}

/**
 * Get a public URL for a file in Supabase Storage
 */
export function getPublicUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Upload file to local storage (fallback for development)
 */
export async function uploadToLocal(
  file: File,
  folder: string = 'uploads'
): Promise<string> {
  // This would be handled server-side in an API route
  // For now, return a placeholder path
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const uploadsDir = path.join(process.cwd(), 'public', folder)
  await fs.mkdir(uploadsDir, { recursive: true })

  const fileName = `${Date.now()}-${file.name}`
  const filePath = path.join(uploadsDir, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())
  
  await fs.writeFile(filePath, buffer)
  return `/${folder}/${fileName}`
}

