import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const upcoming = searchParams.get('upcoming') === 'true'
    const skip = (page - 1) * limit

    const where: any = {}

    if (upcoming) {
      where.startAt = {
        gte: new Date(),
      }
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          host: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              attendees: true,
            },
          },
        },
        orderBy: {
          startAt: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ])

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
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

    const limitResult = rateLimit(`event:${user.id}`, {
      windowMs: 3600000,
      maxRequests: 5,
    })

    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many events created' },
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
      title,
      description,
      startAt,
      endAt,
      location,
      capacity,
      isRecurring,
      recurrenceRule,
    } = body

    if (!title || !startAt || !endAt) {
      return NextResponse.json(
        { error: 'Title, start date, and end date are required' },
        { status: 400 }
      )
    }

    const event = await prisma.event.create({
      data: {
        hostId: dbUser.id,
        title: title.trim(),
        description: description || null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        location: location || null,
        capacity: capacity ? parseInt(capacity) : null,
        isRecurring: isRecurring || false,
        recurrenceRule: recurrenceRule || null,
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

