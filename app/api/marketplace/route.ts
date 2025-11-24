import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const tags = searchParams.get('tags')?.split(',') || []
    const skip = (page - 1) * limit

    const where: any = {
      status: 'active',
    }

    if (category) {
      where.category = category
    }

    if (tags.length > 0) {
      where.tags = {
        hasSome: tags,
      }
    }

    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.marketplaceListing.count({ where }),
    ])

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching marketplace listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch marketplace listings' },
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

    const limitResult = rateLimit(`marketplace:${user.id}`, {
      windowMs: 3600000,
      maxRequests: 5,
    })

    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many listings created' },
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
    const { title, description, category, price, media, tags, tebexLink } = body

    if (!title || !category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      )
    }

    // Validate Tebex link if provided
    if (tebexLink && !tebexLink.trim()) {
      return NextResponse.json(
        { error: 'Tebex link cannot be empty' },
        { status: 400 }
      )
    }

    const listing = await prisma.marketplaceListing.create({
      data: {
        ownerId: dbUser.id,
        title: title.trim(),
        description: description || null,
        category,
        price: price !== undefined ? parseFloat(price) : null,
        media: media || null,
        tags: tags || [],
        tebexLink: tebexLink?.trim() || null,
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

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    console.error('Error creating marketplace listing:', error)
    return NextResponse.json(
      { error: 'Failed to create marketplace listing' },
      { status: 500 }
    )
  }
}

