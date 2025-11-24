import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ disliked: false })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!dbUser) {
      return NextResponse.json({ disliked: false })
    }

    const existingDislike = await prisma.dislike.findUnique({
      where: {
        postId_userId: {
          postId: params.id,
          userId: dbUser.id,
        },
      },
    })

    return NextResponse.json({ disliked: !!existingDislike })
  } catch (error) {
    console.error('Error checking dislike status:', error)
    return NextResponse.json({ disliked: false })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already disliked
    const existingDislike = await prisma.dislike.findUnique({
      where: {
        postId_userId: {
          postId: params.id,
          userId: dbUser.id,
        },
      },
    })

    if (existingDislike) {
      return NextResponse.json({ message: 'Already disliked' })
    }

    // Remove any existing reaction when disliking
    await prisma.reaction.deleteMany({
      where: {
        postId: params.id,
        userId: dbUser.id,
      },
    })

    // Create dislike
    await prisma.dislike.create({
      data: {
        postId: params.id,
        userId: dbUser.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disliking post:', error)
    return NextResponse.json(
      { error: 'Failed to dislike post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.dislike.deleteMany({
      where: {
        postId: params.id,
        userId: dbUser.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing dislike:', error)
    return NextResponse.json(
      { error: 'Failed to remove dislike' },
      { status: 500 }
    )
  }
}

