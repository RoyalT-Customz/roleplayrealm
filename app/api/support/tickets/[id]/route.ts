import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
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

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Only allow ticket owner or admin to view
    if (ticket.userId !== dbUser.id && !dbUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
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

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const body = await request.json()
    const { status, response } = body

    // Only admins can update status and respond
    if (!dbUser.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {}

    // Update status if provided
    if (status) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    // Add response if provided
    if (response && response.trim()) {
      const responses: any[] = ticket.responses && Array.isArray(ticket.responses) 
        ? [...(ticket.responses as any[])] 
        : []
      responses.push({
        userId: dbUser.id,
        username: dbUser.username,
        message: response.trim(),
        createdAt: new Date().toISOString(),
        isAdmin: true,
      })
      updateData.responses = responses
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: updateData,
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

    // Log admin action
    if (response) {
      await prisma.activityLog.create({
        data: {
          userId: dbUser.id,
          action: 'ticket_responded',
          targetType: 'ticket',
          targetId: params.id,
          metadata: {
            description: `Admin responded to ticket: ${ticket.subject}`,
          },
        },
      })
    }

    return NextResponse.json(updatedTicket)
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    )
  }
}

