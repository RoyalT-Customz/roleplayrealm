import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    // If not admin, only show user's own tickets
    if (!dbUser.isAdmin) {
      where.userId = dbUser.id
    }

    // Filter by status if provided
    if (status) {
      where.status = status
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
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
      prisma.ticket.count({ where }),
    ])

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
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

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Rate limiting
    const limitResult = rateLimit(`ticket:${user.id}`, {
      windowMs: 3600000, // 1 hour
      maxRequests: 5,
    })

    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many tickets created. Please wait before submitting another.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { type, subject, description } = body

    if (!type || !subject || !description) {
      return NextResponse.json(
        { error: 'Type, subject, and description are required' },
        { status: 400 }
      )
    }

    const validTypes = ['feature_request', 'marketplace_access', 'other']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid ticket type' },
        { status: 400 }
      )
    }

    const ticket = await prisma.ticket.create({
      data: {
        userId: dbUser.id,
        type,
        subject: subject.trim(),
        description: description.trim(),
        status: 'open',
        responses: [], // Start with empty array
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error: any) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create ticket',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

