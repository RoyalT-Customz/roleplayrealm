import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET all users with marketplace access status
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
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
          hasMarketplaceAccess: true,
          isAdmin: true,
          createdAt: true,
          _count: {
            select: {
              marketplaceListings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching users for marketplace access:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch users',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// UPDATE marketplace access for a user
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
    const { userId, hasMarketplaceAccess } = body

    if (!userId || typeof hasMarketplaceAccess !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: userId and hasMarketplaceAccess' },
        { status: 400 }
      )
    }

    // Update user's marketplace access
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { hasMarketplaceAccess },
      select: {
        id: true,
        email: true,
        username: true,
        hasMarketplaceAccess: true,
      },
    })

    // Log admin activity
    await prisma.activityLog.create({
      data: {
        userId: dbUser.id,
        action: hasMarketplaceAccess ? 'marketplace_access_granted' : 'marketplace_access_revoked',
        targetType: 'user',
        targetId: userId,
        metadata: {
          description: `Admin ${hasMarketplaceAccess ? 'granted' : 'revoked'} marketplace access for user ${updatedUser.username} (${updatedUser.email})`,
        },
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Error updating marketplace access:', error)
    return NextResponse.json(
      {
        error: 'Failed to update marketplace access',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

