import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  const username = process.argv[2] || 'admin';
  
  try {
    const user = await prisma.user.update({
      where: { username },
      data: { role: 'ADMIN' }
    });
    
    console.log(`✅ User '${username}' is now an ADMIN`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
