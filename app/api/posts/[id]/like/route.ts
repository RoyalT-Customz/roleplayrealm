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
      return NextResponse.json({ liked: false })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!dbUser) {
      return NextResponse.json({ liked: false })
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: params.id,
          userId: dbUser.id,
        },
      },
    })

    return NextResponse.json({ liked: !!existingLike })
  } catch (error) {
    console.error('Error checking like status:', error)
    return NextResponse.json({ liked: false })
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

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: params.id,
          userId: dbUser.id,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json({ message: 'Already liked' })
    }

    // Create like
    await prisma.like.create({
      data: {
        postId: params.id,
        userId: dbUser.id,
      },
    })

    // Create notification for post author
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    })

    if (post && post.authorId !== dbUser.id) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'like',
          data: {
            postId: params.id,
            userId: dbUser.id,
            username: dbUser.username,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error liking post:', error)
    return NextResponse.json(
      { error: 'Failed to like post' },
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

    await prisma.like.deleteMany({
      where: {
        postId: params.id,
        userId: dbUser.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unliking post:', error)
    return NextResponse.json(
      { error: 'Failed to unlike post' },
      { status: 500 }
    )
  }
}

