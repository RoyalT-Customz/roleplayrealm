import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeAdmin() {
  const email = 'kingroyalt.vu@gmail.com'

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log(`User with email ${email} not found. Creating user as admin...`)
      // Create user if they don't exist (they might not have signed up yet)
      const newUser = await prisma.user.create({
        data: {
          email,
          username: email.split('@')[0],
          isAdmin: true,
        },
      })
      console.log(`✅ Created user and set as admin: ${newUser.username} (${newUser.email})`)
    } else {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { isAdmin: true },
      })
      console.log(`✅ User ${updatedUser.username} (${updatedUser.email}) is now an admin!`)
    }
  } catch (error) {
    console.error('Error making user admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmin()

