import prisma from '../src/prismaClient';

async function checkUsers() {
  try {
    console.log('🔍 Checking users in production database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        usdBalance: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      return;
    }

    console.log(`✅ Found ${users.length} user(s):\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Balance: $${user.usdBalance.toString()}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Check for admin user specifically
    const admin = users.find(u => u.role === 'ADMIN');
    if (admin) {
      console.log(`✅ Admin user found: ${admin.username} (${admin.email})`);
    } else {
      console.log('⚠️ No ADMIN user found!');
    }

    // Check for test user
    const testUser = users.find(u => u.username === 'testuser' || u.email === 'test@example.com');
    if (testUser) {
      console.log(`✅ Test user found: ${testUser.username} (${testUser.email})`);
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
