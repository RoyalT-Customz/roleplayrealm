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
      return NextResponse.json({ reaction: null })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!dbUser) {
      return NextResponse.json({ reaction: null })
    }

    const existingReaction = await prisma.reaction.findUnique({
      where: {
        postId_userId: {
          postId: params.id,
          userId: dbUser.id,
        },
      },
    })

    return NextResponse.json({ reaction: existingReaction?.emoji || null })
  } catch (error) {
    console.error('Error checking reaction status:', error)
    return NextResponse.json({ reaction: null })
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

    const body = await request.json()
    const { emoji } = body

    // Validate emoji type
    const validEmojis = ['like', 'love', 'laugh', 'wow', 'sad', 'angry']
    if (!emoji || !validEmojis.includes(emoji)) {
      return NextResponse.json(
        { error: 'Invalid emoji type' },
        { status: 400 }
      )
    }

    // Check if already reacted
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        postId_userId: {
          postId: params.id,
          userId: dbUser.id,
        },
      },
    })

    // Remove any existing dislike when reacting
    await prisma.dislike.deleteMany({
      where: {
        postId: params.id,
        userId: dbUser.id,
      },
    })

    if (existingReaction) {
      // Update existing reaction if different emoji
      if (existingReaction.emoji !== emoji) {
        await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: { emoji },
        })
      }
      return NextResponse.json({ success: true })
    }

    // Create reaction
    await prisma.reaction.create({
      data: {
        postId: params.id,
        userId: dbUser.id,
        emoji,
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
          type: 'reaction',
          data: {
            postId: params.id,
            userId: dbUser.id,
            username: dbUser.username,
            emoji,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reacting to post:', error)
    return NextResponse.json(
      { error: 'Failed to react to post' },
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

    await prisma.reaction.deleteMany({
      where: {
        postId: params.id,
        userId: dbUser.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing reaction:', error)
    return NextResponse.json(
      { error: 'Failed to remove reaction' },
      { status: 500 }
    )
  }
}

