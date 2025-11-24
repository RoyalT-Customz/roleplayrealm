# Roleplay Realm - FiveM Community Hub

A production-ready starter web application for FiveM communities. Connect with players, share RP content, discover servers, scripts, and join events.

## Features

### MVP Features
- ✅ User authentication (Supabase Auth)
- ✅ User profiles with avatars and bios
- ✅ Global feed (photos, clips, text posts)
- ✅ Server listings with upvotes and comments
- ✅ Server recruitment board
- ✅ Media upload pipeline (Supabase Storage)
- ✅ Search and filters
- ✅ Real-time notifications
- ✅ Admin dashboard
- ✅ Responsive UI with dark theme

### Advanced Features
- ✅ Script & Asset Marketplace
- ✅ Talent Marketplace
- ✅ Event calendar with RSVP
- ✅ Creator tools (watermarking, clip trimming placeholders)
- ✅ Creator badges and verification
- ✅ Trending algorithms
- ✅ Rate limiting
- ✅ Webhook endpoints (placeholders)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes + Prisma
- **Database**: PostgreSQL (via Prisma)
- **Auth & Storage**: Supabase (Auth, Storage, Realtime)
- **Testing**: Vitest
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- PostgreSQL database (local or hosted)
- Supabase account (for auth and storage)

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd roleplay-realm
pnpm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### 3. Set Up Database

```bash
# Run migrations
pnpm migrate

# Seed the database with sample data
pnpm seed
```

### 4. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and keys from Settings > API
3. Create storage buckets:
   - `uploads` (public bucket for images and videos)
   - Set up storage policies to allow authenticated uploads

Storage Policy Example (SQL in Supabase Dashboard):
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
roleplay-realm/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── servers/           # Server listing pages
│   └── ...
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── feed/             # Feed-related components
│   └── servers/          # Server-related components
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Prisma client
│   ├── supabase/         # Supabase helpers
│   └── utils.ts          # Utility functions
├── prisma/               # Prisma schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
└── tests/                # Test files
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests
- `pnpm migrate` - Run Prisma migrations
- `pnpm seed` - Seed database with sample data
- `pnpm db:studio` - Open Prisma Studio

## Database Schema

Key models:
- `User` - User accounts and profiles
- `Post` - Feed posts with media
- `Comment` - Post comments
- `Like` - Post likes
- `ServerListing` - FiveM server listings
- `MarketplaceListing` - Script/asset marketplace
- `TalentListing` - Talent marketplace
- `Event` - Community events
- `Notification` - User notifications
- `Follow` - User follows
- `Flag` - Content moderation flags

See `prisma/schema.prisma` for full schema.

## API Routes

### Posts
- `GET /api/posts` - List posts (paginated)
- `POST /api/posts` - Create post
- `GET /api/posts/[id]` - Get post details
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post
- `POST /api/posts/[id]/like` - Like post
- `DELETE /api/posts/[id]/like` - Unlike post
- `GET /api/posts/[id]/comments` - Get comments
- `POST /api/posts/[id]/comments` - Create comment

### Servers
- `GET /api/servers` - List servers
- `POST /api/servers` - Create server listing

### Marketplace
- `GET /api/marketplace` - List marketplace items
- `POST /api/marketplace` - Create listing

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event

### Search
- `GET /api/search` - Search across posts, servers, marketplace

### Upload
- `POST /api/upload-url` - Get signed upload URL

### Admin
- `POST /api/admin/feature` - Feature/unfeature server

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set all required environment variables in your hosting platform:
- `DATABASE_URL` (use connection pooling URL for serverless)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)

### Database

For production, use a managed PostgreSQL service:
- Supabase (recommended - same provider)
- Neon
- Railway
- AWS RDS

Run migrations in production:
```bash
pnpm migrate:deploy
```

## Local Development Without Supabase

If you want to develop without Supabase:

1. Use local file storage (implemented in `lib/supabase/storage.ts`)
2. Use NextAuth or another auth provider
3. Update `lib/supabase/client.ts` to use your alternative

See TODO comments in code for integration points.

## Testing

Run tests:
```bash
pnpm test
```

Run tests with UI:
```bash
pnpm test:ui
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## TODO / Future Enhancements

- [ ] Integrate Algolia for advanced search
- [ ] Add Stripe integration for paid marketplace items
- [ ] Implement video transcoding (e.g., Cloudflare Stream)
- [ ] Add content moderation API integration
- [ ] Implement Redis for rate limiting in production
- [ ] Add E2E tests with Playwright
- [ ] Add analytics dashboard
- [ ] Implement bookmarking system
- [ ] Add YouTube webhook ingestion

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

Built with ❤️ for the FiveM community.

