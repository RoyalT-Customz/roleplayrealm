import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@roleplayrealm.com' },
    update: {},
    create: {
      email: 'admin@roleplayrealm.com',
      username: 'admin',
      isAdmin: true,
      bio: 'Administrator of Roleplay Realm',
      badges: [{ type: 'admin', verified: true }],
    },
  })

  // Create sample users
  const users = []
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@example.com` },
      update: {},
      create: {
        email: `user${i}@example.com`,
        username: `user${i}`,
        bio: `FiveM enthusiast and roleplayer #${i}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
        badges: i <= 3 ? [{ type: 'creator', verified: true }] : undefined,
      },
    })
    users.push(user)
  }

  // Create sample posts
  const posts = []
  const sampleContent = [
    'Just had an amazing RP session! 🎭',
    'Check out this cool clip from our server!',
    'New script release coming soon...',
    'Looking for a good FiveM server? Check us out!',
    'Amazing car meetup last night!',
  ]

  for (let i = 0; i < 20; i++) {
    const author = users[Math.floor(Math.random() * users.length)]
    const post = await prisma.post.create({
      data: {
        authorId: author.id,
        content: sampleContent[i % sampleContent.length],
        tags: ['fivem', 'roleplay', 'gaming'],
        media: i % 3 === 0 ? [
          {
            type: 'image',
            url: `https://picsum.photos/800/600?random=${i}`,
          },
        ] : i % 5 === 0 ? [
          {
            type: 'video',
            url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`,
            thumbnail: `https://picsum.photos/800/600?random=${i}`,
          },
        ] : undefined,
      },
    })
    posts.push(post)
  }

  // Create likes
  for (const post of posts) {
    const likeCount = Math.floor(Math.random() * 10)
    for (let i = 0; i < likeCount; i++) {
      const user = users[Math.floor(Math.random() * users.length)]
      try {
        await prisma.like.create({
          data: {
            postId: post.id,
            userId: user.id,
          },
        })
      } catch (e) {
        // Ignore duplicate likes
      }
    }
  }

  // Create comments
  const sampleComments = [
    'Great post!',
    'Love this!',
    'Amazing work!',
    'Keep it up!',
    'This is awesome!',
  ]

  for (const post of posts.slice(0, 10)) {
    const commentCount = Math.floor(Math.random() * 5)
    for (let i = 0; i < commentCount; i++) {
      const user = users[Math.floor(Math.random() * users.length)]
      await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content: sampleComments[i % sampleComments.length],
        },
      })
    }
  }

  // Create server listings
  const serverNames = [
    'Los Santos Roleplay',
    'San Andreas RP',
    'Liberty City RP',
    'Vice City Stories',
    'Paradise RP',
    'Elite Roleplay',
    'Premium RP',
    'City Life RP',
  ]

  const serverFeatures = [
    ['Custom Scripts', 'Active Staff', 'Economy System'],
    ['Realistic Economy', 'Housing System', 'Job System'],
    ['Custom Vehicles', 'Weapon System', 'Gang System'],
    ['Business System', 'Farming', 'Fishing'],
  ]

  for (let i = 0; i < serverNames.length; i++) {
    const owner = users[Math.floor(Math.random() * users.length)]
    const isFeatured = i < 3
    await prisma.serverListing.create({
      data: {
        ownerId: owner.id,
        name: serverNames[i],
        ip: `192.168.1.${100 + i}:30120`,
        connectUrl: `fivem://connect/server${i}.example.com`,
        logoUrl: `https://picsum.photos/200/200?random=${i + 100}`,
        description: `Join ${serverNames[i]} for the best FiveM roleplay experience!`,
        features: serverFeatures[i % serverFeatures.length],
        tags: ['roleplay', 'economy', 'custom-scripts'],
        screenshots: [
          `https://picsum.photos/800/600?random=${i + 200}`,
          `https://picsum.photos/800/600?random=${i + 201}`,
        ],
        upvotes: Math.floor(Math.random() * 100),
        isFeatured,
        status: 'active',
      },
    })
  }

  // Create marketplace listings
  const marketplaceItems = [
    { title: 'Advanced Banking System', category: 'script', price: null },
    { title: 'Custom Vehicle Pack', category: 'asset', price: 29.99 },
    { title: 'Housing System', category: 'script', price: null },
    { title: 'Job System Script', category: 'script', price: 49.99 },
    { title: 'Weapon Pack', category: 'asset', price: 19.99 },
  ]

  for (const item of marketplaceItems) {
    const owner = users[Math.floor(Math.random() * users.length)]
    await prisma.marketplaceListing.create({
      data: {
        ownerId: owner.id,
        title: item.title,
        description: `High-quality ${item.category} for FiveM servers.`,
        category: item.category,
        price: item.price,
        tags: ['fivem', item.category, 'quality'],
        downloads: Math.floor(Math.random() * 500),
        status: 'active',
      },
    })
  }

  // Create events
  const eventTitles = [
    'Weekly Car Meet',
    'Server Launch Event',
    'RP Tournament',
    'Community Gathering',
  ]

  for (let i = 0; i < eventTitles.length; i++) {
    const host = users[Math.floor(Math.random() * users.length)]
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + i * 7)
    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + 2)

    await prisma.event.create({
      data: {
        hostId: host.id,
        title: eventTitles[i],
        description: `Join us for ${eventTitles[i]}!`,
        startAt: startDate,
        endAt: endDate,
        location: `Server: Los Santos RP`,
        capacity: 50,
      },
    })
  }

  // Create follows
  for (let i = 0; i < 20; i++) {
    const follower = users[Math.floor(Math.random() * users.length)]
    const following = users[Math.floor(Math.random() * users.length)]
    if (follower.id !== following.id) {
      try {
        await prisma.follow.create({
          data: {
            followerId: follower.id,
            followingId: following.id,
          },
        })
      } catch (e) {
        // Ignore duplicates
      }
    }
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

