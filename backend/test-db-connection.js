const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n=== Testing Production Database Connection ===\n');
    
    // Test 1: Count users
    const userCount = await prisma.user.count();
    console.log('✅ Database connected successfully!');
    console.log('📊 Total users in database:', userCount);
    
    // Test 2: Get first few users (limited info)
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    
    if (users.length > 0) {
      console.log('\n📋 Sample users:');
      console.table(users);
    } else {
      console.log('\n⚠️  No users found in database');
    }
    
    // Test 3: Database info
    const result = await prisma.$queryRaw`SELECT current_database() as db, current_user as user, version() as version`;
    console.log('\n🔧 Database info:');
    console.log('Database:', result[0].db);
    console.log('User:', result[0].user);
    console.log('Version:', result[0].version.split(' ')[0], result[0].version.split(' ')[1]);
    
    await prisma.$disconnect();
    console.log('\n✅ All tests passed!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
