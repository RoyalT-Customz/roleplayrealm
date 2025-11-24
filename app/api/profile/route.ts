import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

// GET current user's profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user in database by email
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        _count: {
          select: {
            posts: true,
            serverListings: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    // Create user if they don't exist yet
    if (!dbUser) {
      const username = user.user_metadata?.username || user.email.split('@')[0]
      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          username: username,
        },
        include: {
          _count: {
            select: {
              posts: true,
              serverListings: true,
              followers: true,
              following: true,
            },
          },
        },
      })
    }

    // Return profile data
    return NextResponse.json({
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      avatarUrl: dbUser.avatarUrl,
      bannerUrl: dbUser.bannerUrl,
      bio: dbUser.bio,
      isAdmin: dbUser.isAdmin,
      badges: dbUser.badges,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      stats: {
        posts: dbUser._count.posts,
        servers: dbUser._count.serverListings,
        followers: dbUser._count.followers,
        following: dbUser._count.following,
      },
    })
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch profile',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

// UPDATE current user's profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const limitResult = rateLimit(`profile:${user.id}`, {
      windowMs: 60000, // 1 minute
      maxRequests: 10,
    })

    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before updating again.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { username, avatarUrl, bio } = body

    // Validate username if provided
    if (username !== undefined) {
      if (!username || username.trim().length === 0) {
        return NextResponse.json(
          { error: 'Username cannot be empty' },
          { status: 400 }
        )
      }

      if (username.length < 3 || username.length > 30) {
        return NextResponse.json(
          { error: 'Username must be between 3 and 30 characters' },
          { status: 400 }
        )
      }

      // Check username format (alphanumeric, underscore, hyphen)
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return NextResponse.json(
          { error: 'Username can only contain letters, numbers, underscores, and hyphens' },
          { status: 400 }
        )
      }

      // Check if username is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { username },
      })

      if (existingUser && existingUser.email !== user.email) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        )
      }
    }

    // Validate bio if provided
    if (bio !== undefined && bio && bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio must be less than 500 characters' },
        { status: 400 }
      )
    }

    // Find user in database
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    })

    // Create user if they don't exist yet
    if (!dbUser) {
      const defaultUsername = user.user_metadata?.username || user.email.split('@')[0]
      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          username: defaultUsername,
        },
      })
    }

    // Prepare update data
    const updateData: any = {}
    if (username !== undefined) updateData.username = username.trim()
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null
    if (bio !== undefined) updateData.bio = bio?.trim() || null

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: updateData,
      include: {
        _count: {
          select: {
            posts: true,
            serverListings: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      avatarUrl: updatedUser.avatarUrl,
      bannerUrl: updatedUser.bannerUrl,
      bio: updatedUser.bio,
      isAdmin: updatedUser.isAdmin,
      badges: updatedUser.badges,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      stats: {
        posts: updatedUser._count.posts,
        servers: updatedUser._count.serverListings,
        followers: updatedUser._count.followers,
        following: updatedUser._count.following,
      },
    })
  } catch (error: any) {
    console.error('Error updating profile:', error)

    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to update profile',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

