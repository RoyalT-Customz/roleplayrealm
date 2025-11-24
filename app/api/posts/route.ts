import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const tags = searchParams.get('tags')?.split(',') || []
    const skip = (page - 1) * limit

    const where: any = {
      visibility: 'public',
    }

    if (tags.length > 0) {
      where.tags = {
        hasSome: tags,
      }
    }

    let posts, total
    
    try {
      // Try with all counts including reactions and dislikes
      [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
                reactions: true,
                dislikes: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.post.count({ where }),
      ])
    } catch (error: any) {
      // Fallback if Prisma Client is outdated - use basic counts only
      console.warn('Error fetching with reactions/dislikes, falling back to basic counts:', error.message)
      [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.post.count({ where }),
      ])
      
      // Add default values for reactions and dislikes
      posts = posts.map((post: any) => ({
        ...post,
        _count: {
          ...post._count,
          reactions: 0,
          dislikes: 0,
        },
      }))
    }

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch posts',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const limitResult = rateLimit(`post:${user.id}`, {
      windowMs: 60000, // 1 minute
      maxRequests: 5,
    })

    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before posting again.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { content, media, tags, visibility } = body

    // Validate media files (basic validation)
    if (media && Array.isArray(media)) {
      for (const item of media) {
        if (!item.type || !item.url) {
          return NextResponse.json(
            { error: 'Invalid media format' },
            { status: 400 }
          )
        }
      }
    }

    // Get or create user in database
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: user.email!,
          username: user.email!.split('@')[0], // Default username
        },
      })
    }

    const post = await prisma.post.create({
      data: {
        authorId: dbUser.id,
        content: content || null,
        media: media || null,
        tags: tags || [],
        visibility: visibility || 'public',
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error: any) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create post',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

