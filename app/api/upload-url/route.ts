import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUploadUrl } from '@/lib/supabase/storage'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, fileType, fileSize, bucket = 'uploads' } = body

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes]

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Validate file size (10MB for images, 100MB for videos)
    const maxImageSize = 10 * 1024 * 1024
    const maxVideoSize = 100 * 1024 * 1024
    const maxSize = allowedImageTypes.includes(fileType) ? maxImageSize : maxVideoSize

    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    const folder = allowedImageTypes.includes(fileType) ? 'images' : 'videos'
    const { path } = await getUploadUrl(
      bucket,
      fileName,
      fileType,
      fileSize,
      { folder }
    )

    // Return path for client-side upload
    // Client will upload directly to Supabase Storage using the anon key
    return NextResponse.json({ path, bucket })
  } catch (error: any) {
    console.error('Error generating upload URL:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}

