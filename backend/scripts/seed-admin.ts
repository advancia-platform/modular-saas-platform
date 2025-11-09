import 'dotenv/config';
import prisma from '../src/prismaClient';
import bcrypt from 'bcryptjs';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@advanciapay.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const firstName = 'System';
  const lastName = 'Admin';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ Admin already exists: ${email}`);
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash: hash,
      firstName,
      lastName,
      role: 'ADMIN',
      active: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });
  console.log(`✅ Admin created: ${user.email} (password: ${password})`);
}

main()
  .catch((e) => {
    console.error('Seed admin failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
