import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q') || ''
    const tags = searchParams.get('tags')?.split(',') || []
    const category = searchParams.get('category')
    const type = searchParams.get('type') || 'all' // all, posts, servers, marketplace

    const results: any = {
      posts: [],
      servers: [],
      marketplace: [],
    }

    // Search posts
    if (type === 'all' || type === 'posts') {
      const postWhere: any = {
        visibility: 'public',
      }

      if (q) {
        postWhere.OR = [
          { content: { contains: q, mode: 'insensitive' } },
          { tags: { hasSome: [q] } },
        ]
      }

      if (tags.length > 0) {
        postWhere.tags = {
          hasSome: tags,
        }
      }

      results.posts = await prisma.post.findMany({
        where: postWhere,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      })
    }

    // Search servers
    if (type === 'all' || type === 'servers') {
      const serverWhere: any = {
        status: 'active',
      }

      if (q) {
        serverWhere.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { tags: { hasSome: [q] } },
        ]
      }

      if (tags.length > 0) {
        serverWhere.tags = {
          hasSome: tags,
        }
      }

      results.servers = await prisma.serverListing.findMany({
        where: serverWhere,
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
          upvotes: 'desc',
        },
        take: 10,
      })
    }

    // Search marketplace
    if (type === 'all' || type === 'marketplace') {
      const marketplaceWhere: any = {
        status: 'active',
      }

      if (q) {
        marketplaceWhere.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { tags: { hasSome: [q] } },
        ]
      }

      if (category) {
        marketplaceWhere.category = category
      }

      if (tags.length > 0) {
        marketplaceWhere.tags = {
          hasSome: tags,
        }
      }

      results.marketplace = await prisma.marketplaceListing.findMany({
        where: marketplaceWhere,
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
        take: 10,
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    )
  }
}

