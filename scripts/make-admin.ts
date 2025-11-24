import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeAdmin() {
  const email = 'kingroyalt.vu@gmail.com'

  try {
    // First, remove admin status from all other users
    const removedAdmins = await prisma.user.updateMany({
      where: {
        email: { not: email },
        isAdmin: true,
      },
      data: {
        isAdmin: false,
      },
    })
    
    if (removedAdmins.count > 0) {
      console.log(`✅ Removed admin status from ${removedAdmins.count} other user(s)`)
    }

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

    console.log(`\n🎉 Setup complete! You are now the only admin and owner.`)
    console.log(`   Email: ${email}`)
    console.log(`   Owner status is automatically granted based on your email.`)
  } catch (error) {
    console.error('Error making user admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmin()

