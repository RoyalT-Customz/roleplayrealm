# Developer Guide - Roleplay Realm

This guide explains how to extend and customize Roleplay Realm.

## Architecture Overview

### Frontend
- **Next.js App Router**: File-based routing in `app/` directory
- **React Server Components**: Default for pages
- **Client Components**: Marked with `'use client'` for interactivity
- **Tailwind CSS**: Utility-first styling with custom theme

### Backend
- **API Routes**: Next.js API routes in `app/api/`
- **Prisma ORM**: Database access layer
- **Supabase**: Auth, storage, and realtime

### State Management
- **React Context**: For auth state (`app/providers.tsx`)
- **Server State**: Fetch directly in components or use React Query (optional)

## Adding New Features

### 1. Adding a New Page

Create a new file in `app/`:

```tsx
// app/new-feature/page.tsx
export default function NewFeaturePage() {
  return <div>New Feature</div>
}
```

### 2. Adding a New API Route

Create a route handler in `app/api/`:

```tsx
// app/api/new-feature/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // Your logic here
  return NextResponse.json({ data: 'example' })
}
```

### 3. Adding a New Database Model

1. Update `prisma/schema.prisma`:

```prisma
model NewModel {
  id        String   @id @default(cuid())
  // ... fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

2. Create migration:
```bash
pnpm migrate
```

3. Use in code:
```ts
await prisma.newModel.create({ data: { ... } })
```

### 4. Adding a New UI Component

Create in `components/`:

```tsx
// components/feature/NewComponent.tsx
'use client'

export function NewComponent() {
  return <div>New Component</div>
}
```

## Authentication

### Checking Auth Status

```tsx
'use client'
import { useAuth } from '@/app/providers'

export function MyComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  
  return <div>Welcome, {user.email}</div>
}
```

### Server-Side Auth

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function MyServerComponent() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Redirect or show error
  }
  
  // Use user
}
```

## File Uploads

### Client-Side Upload Flow

1. Get signed URL from API:
```ts
const response = await fetch('/api/upload-url', {
  method: 'POST',
  body: JSON.stringify({ fileName, fileType, fileSize }),
})
const { url, path } = await response.json()
```

2. Upload to Supabase:
```ts
await fetch(url, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type },
})
```

3. Get public URL:
```ts
import { getPublicUrl } from '@/lib/supabase/storage'
const publicUrl = getPublicUrl('uploads', path)
```

## Real-time Features

### Subscribing to Notifications

```tsx
'use client'
import { useEffect } from 'react'
import { subscribeToNotifications } from '@/lib/supabase/realtime'

export function NotificationListener() {
  useEffect(() => {
    const channel = subscribeToNotifications(userId, (payload) => {
      console.log('New notification:', payload)
    })
    
    return () => {
      channel.unsubscribe()
    }
  }, [userId])
}
```

## Rate Limiting

Rate limiting is implemented in-memory for development. For production, use Redis:

```ts
// lib/rate-limit.ts
// TODO: Replace with Redis implementation
```

Example Redis implementation:
```ts
import Redis from 'ioredis'
const redis = new Redis(process.env.REDIS_URL)

export async function rateLimitRedis(identifier: string, options: RateLimitOptions) {
  const key = `ratelimit:${identifier}`
  const count = await redis.incr(key)
  
  if (count === 1) {
    await redis.expire(key, Math.ceil(options.windowMs / 1000))
  }
  
  return {
    allowed: count <= options.maxRequests,
    remaining: Math.max(0, options.maxRequests - count),
  }
}
```

## Styling

### Using Tailwind

```tsx
<div className="bg-dark-800 text-white p-4 rounded-lg">
  Content
</div>
```

### Custom Components

Use the utility classes defined in `app/globals.css`:

```tsx
<button className="btn btn-primary">Click me</button>
<input className="input" />
<div className="card">Card content</div>
```

### Theme Colors

- Primary: `primary-*` (orange/red gradient)
- Dark: `dark-*` (black/gray scale)
- Use `text-primary-400`, `bg-dark-800`, etc.

## Database Queries

### Basic Queries

```ts
// Find many
const posts = await prisma.post.findMany({
  where: { visibility: 'public' },
  include: { author: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
})

// Find unique
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
})

// Create
const post = await prisma.post.create({
  data: {
    authorId: userId,
    content: 'Hello world',
  },
})

// Update
await prisma.post.update({
  where: { id: postId },
  data: { content: 'Updated' },
})

// Delete
await prisma.post.delete({
  where: { id: postId },
})
```

### Complex Queries

```ts
// Filter by array contains
const posts = await prisma.post.findMany({
  where: {
    tags: {
      hasSome: ['fivem', 'roleplay'],
    },
  },
})

// Relations
const post = await prisma.post.findUnique({
  where: { id: postId },
  include: {
    author: true,
    comments: {
      include: { author: true },
    },
    _count: {
      select: { likes: true, comments: true },
    },
  },
})
```

## Error Handling

### API Routes

```ts
export async function GET(request: NextRequest) {
  try {
    // Your logic
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
```

### Client Components

```tsx
try {
  const response = await fetch('/api/posts')
  if (!response.ok) {
    throw new Error('Failed to fetch')
  }
  const data = await response.json()
} catch (error) {
  console.error(error)
  // Show error to user
}
```

## Testing

### Unit Tests

Create test files in `tests/`:

```ts
import { describe, it, expect } from 'vitest'

describe('MyFeature', () => {
  it('should work', () => {
    expect(true).toBe(true)
  })
})
```

### API Route Tests

Mock Prisma and Supabase:

```ts
import { vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
    },
  },
}))
```

## Performance Optimization

### Image Optimization

Next.js Image component:
```tsx
import Image from 'next/image'

<Image
  src={imageUrl}
  alt="Description"
  width={800}
  height={600}
  className="rounded-lg"
/>
```

### Code Splitting

Next.js automatically code-splits. For manual splitting:
```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
})
```

## Security Best Practices

1. **Always validate input** on API routes
2. **Use rate limiting** on create/update endpoints
3. **Check permissions** before allowing actions
4. **Sanitize user content** before displaying
5. **Use environment variables** for secrets
6. **Enable CORS** properly for API routes
7. **Validate file types and sizes** on uploads

## Common Patterns

### Pagination

```ts
const page = parseInt(searchParams.get('page') || '1')
const limit = 20
const skip = (page - 1) * limit

const [items, total] = await Promise.all([
  prisma.item.findMany({ skip, take: limit }),
  prisma.item.count(),
])
```

### Search

```ts
const q = searchParams.get('q') || ''

const items = await prisma.item.findMany({
  where: {
    OR: [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ],
  },
})
```

### Filtering

```ts
const tags = searchParams.get('tags')?.split(',') || []

const items = await prisma.item.findMany({
  where: {
    tags: {
      hasSome: tags,
    },
  },
})
```

## Troubleshooting

### Database Connection Issues

- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify network access if using remote database

### Supabase Issues

- Verify API keys in `.env`
- Check Supabase project status
- Review storage bucket policies

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`
- Check TypeScript errors: `pnpm type-check`

## Getting Help

- Check existing issues on GitHub
- Review Prisma docs: https://www.prisma.io/docs
- Review Supabase docs: https://supabase.com/docs
- Review Next.js docs: https://nextjs.org/docs

