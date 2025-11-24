import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    // TODO: Check if user is admin (query database)
  }

  // Protect authenticated routes
  if (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/create')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/create/:path*',
  ],
}

