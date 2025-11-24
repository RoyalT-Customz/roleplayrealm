import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
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

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error fetching marketplace listing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch marketplace listing' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.ownerId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Note: Only owners can edit their own listings, so no admin action logging needed here
    const body = await request.json()
    const { title, description, category, price, media, tags, tebexLink } = body

    // Validate required fields
    if (title !== undefined && !title.trim()) {
      return NextResponse.json(
        { error: 'Title cannot be empty' },
        { status: 400 }
      )
    }

    if (category !== undefined && !category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    // Validate Tebex link if provided
    if (tebexLink !== undefined && tebexLink && !tebexLink.trim()) {
      return NextResponse.json(
        { error: 'Tebex link cannot be empty' },
        { status: 400 }
      )
    }

    const updatedListing = await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description : undefined,
        category: category !== undefined ? category : undefined,
        price: price !== undefined ? (price ? parseFloat(price) : null) : undefined,
        media: media !== undefined ? media : undefined,
        tags: tags !== undefined ? tags : undefined,
        tebexLink: tebexLink !== undefined ? (tebexLink?.trim() || null) : undefined,
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

    return NextResponse.json(updatedListing)
  } catch (error) {
    console.error('Error updating marketplace listing:', error)
    return NextResponse.json(
      { error: 'Failed to update marketplace listing' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.ownerId !== dbUser.id && !dbUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isAdminAction = listing.ownerId !== dbUser.id && dbUser.isAdmin

    await prisma.marketplaceListing.delete({
      where: { id: params.id },
    })

    // Log admin action
    if (isAdminAction) {
      await prisma.activityLog.create({
        data: {
          userId: dbUser.id,
          action: 'marketplace_listing_deleted',
          targetType: 'marketplace_listing',
          targetId: params.id,
          metadata: {
            description: `Admin deleted marketplace listing by user ${listing.ownerId}`,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting marketplace listing:', error)
    return NextResponse.json(
      { error: 'Failed to delete marketplace listing' },
      { status: 500 }
    )
  }
}

