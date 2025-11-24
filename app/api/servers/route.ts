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
    const featured = searchParams.get('featured') === 'true'
    const skip = (page - 1) * limit

    const where: any = {
      status: 'active',
    }

    if (featured) {
      where.isFeatured = true
    }

    if (tags.length > 0) {
      where.tags = {
        hasSome: tags,
      }
    }

    const [servers, total] = await Promise.all([
      prisma.serverListing.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: featured
          ? [{ isFeatured: 'desc' }, { upvotes: 'desc' }, { createdAt: 'desc' }]
          : [{ upvotes: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.serverListing.count({ where }),
    ])

    return NextResponse.json({
      servers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching servers:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch servers',
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
    const limitResult = rateLimit(`server:${user.id}`, {
      windowMs: 3600000, // 1 hour
      maxRequests: 3,
    })

    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many server listings created. Please wait before creating another.' },
        { status: 429 }
      )
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      ip,
      connectUrl,
      logoUrl,
      description,
      features,
      tags,
      trailerUrl,
      screenshots,
    } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Server name is required' },
        { status: 400 }
      )
    }

    const server = await prisma.serverListing.create({
      data: {
        ownerId: dbUser.id,
        name: name.trim(),
        ip: ip || null,
        connectUrl: connectUrl || null,
        logoUrl: logoUrl || null,
        description: description || null,
        features: features || null,
        tags: tags || [],
        trailerUrl: trailerUrl || null,
        screenshots: screenshots || null,
        status: 'pending', // Requires admin approval
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json(server, { status: 201 })
  } catch (error) {
    console.error('Error creating server:', error)
    return NextResponse.json(
      { error: 'Failed to create server listing' },
      { status: 500 }
    )
  }
}

