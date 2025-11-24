import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const OWNER_EMAIL = 'kingroyalt.vu@gmail.com'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow the owner email
    if (user.email !== OWNER_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true, email: true, username: true },
    })

    const adminIds = admins.map((admin) => admin.id)

    // Get activity logs for admin actions
    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          userId: { in: adminIds },
          action: {
            in: [
              'post_deleted',
              'post_edited',
              'marketplace_listing_deleted',
              'marketplace_listing_edited',
              'server_featured',
              'server_unfeatured',
              'user_banned',
              'user_unbanned',
            ],
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({
        where: {
          userId: { in: adminIds },
          action: {
            in: [
              'post_deleted',
              'post_edited',
              'marketplace_listing_deleted',
              'marketplace_listing_edited',
              'server_featured',
              'server_unfeatured',
              'user_banned',
              'user_unbanned',
            ],
          },
        },
      }),
    ])

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      admins: admins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        username: admin.username,
      })),
    })
  } catch (error) {
    console.error('Error fetching admin activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin activity' },
      { status: 500 }
    )
  }
}

