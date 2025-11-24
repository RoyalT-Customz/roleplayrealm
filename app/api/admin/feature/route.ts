import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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

    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { serverId, featured } = body

    if (!serverId || typeof featured !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    const server = await prisma.serverListing.update({
      where: { id: serverId },
      data: { isFeatured: featured },
    })

    // Log admin action
    await prisma.activityLog.create({
      data: {
        userId: dbUser.id,
        action: featured ? 'server_featured' : 'server_unfeatured',
        targetType: 'server_listing',
        targetId: serverId,
        metadata: {
          description: `Admin ${featured ? 'featured' : 'unfeatured'} server: ${server.name}`,
        },
      },
    })

    return NextResponse.json(server)
  } catch (error) {
    console.error('Error updating featured status:', error)
    return NextResponse.json(
      { error: 'Failed to update featured status' },
      { status: 500 }
    )
  }
}

