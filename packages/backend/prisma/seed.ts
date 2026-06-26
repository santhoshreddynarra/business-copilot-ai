import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Ensure roles exist
  const roles = ['ADMIN', 'MANAGER', 'ANALYST', 'VIEWER'];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role, description: `${role} role` },
    });
  }
  
  // Seed admin user
  const email = 'admin@company.com';
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const role = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (!role) throw new Error('Role not found');
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin User',
      passwordHash,
      roleId: role.id,
    },
  });
  
  console.log('Seed completed successfully. Test User:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
