import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') // Optional status filter
    const skip = (page - 1) * limit

    const where: any = {}
    
    // If status is specified, filter by it, otherwise get all servers
    if (status) {
      where.status = status
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
        orderBy: [
          { status: 'asc' }, // Pending first, then active, then suspended
          { createdAt: 'desc' },
        ],
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
    console.error('Error fetching servers for admin:', error)
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

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { serverId, status } = body

    if (!serverId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'active', 'suspended']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updatedServer = await prisma.serverListing.update({
      where: { id: serverId },
      data: { status },
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

    return NextResponse.json(updatedServer)
  } catch (error: any) {
    console.error('Error updating server status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update server status',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

