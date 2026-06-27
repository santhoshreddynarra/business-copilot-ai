/**
 * Database Seed Script
 * Run with: npx ts-node src/scripts/seed.ts
 *
 * Creates:
 *  - 4 Roles (ADMIN, MANAGER, ANALYST, VIEWER)
 *  - 3 Demo users (one per role)
 *  - 5 Sample documents per user
 */

import { prisma } from '../utils/prisma';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ── Roles ──────────────────────────────────────────────────────────────────
  console.log('Creating roles...');
  const roles = await Promise.all(
    [
      { name: 'ADMIN', description: 'Full platform access, user management' },
      { name: 'MANAGER', description: 'Upload and process documents, view analytics' },
      { name: 'ANALYST', description: 'Search and view documents' },
      { name: 'VIEWER', description: 'Read-only search access' },
    ].map(r =>
      prisma.role.upsert({
        where: { name: r.name },
        update: {},
        create: r,
      })
    )
  );
  console.log(`  ✅ ${roles.length} roles ready\n`);

  // ── Demo Users ─────────────────────────────────────────────────────────────
  console.log('Creating demo users...');
  const password = await bcrypt.hash('Demo@1234', 10);

  const adminRole = roles.find(r => r.name === 'ADMIN')!;
  const managerRole = roles.find(r => r.name === 'MANAGER')!;
  const analystRole = roles.find(r => r.name === 'ANALYST')!;

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: {
        email: 'admin@demo.com',
        name: 'Admin User',
        passwordHash: password,
        roleId: adminRole.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@demo.com' },
      update: {},
      create: {
        email: 'manager@demo.com',
        name: 'Manager User',
        passwordHash: password,
        roleId: managerRole.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'analyst@demo.com' },
      update: {},
      create: {
        email: 'analyst@demo.com',
        name: 'Analyst User',
        passwordHash: password,
        roleId: analystRole.id,
      },
    }),
  ]);
  console.log('  ✅ Demo users created:');
  users.forEach(u => console.log(`     - ${u.email} (password: Demo@1234)`));

  // ── Sample Documents ───────────────────────────────────────────────────────
  console.log('\nCreating sample documents...');
  const sampleDocs = [
    { title: 'Q1 2024 Financial Report', type: 'PDF', size: 1_234_567 },
    { title: 'Product Roadmap 2024-2025', type: 'DOCX', size: 567_890 },
    { title: 'Customer Research Findings', type: 'PDF', size: 2_345_678 },
    { title: 'Engineering Runbook', type: 'TXT', size: 123_456 },
    { title: 'Marketing Strategy Q2', type: 'DOCX', size: 890_123 },
  ];

  let docCount = 0;
  for (const user of users) {
    for (const doc of sampleDocs) {
      await prisma.document.upsert({
        where: {
          id: `seed-${user.id}-${doc.title.toLowerCase().replace(/ /g, '-')}`.slice(0, 36),
        },
        update: {},
        create: {
          id: `seed-${user.id}-${doc.title.toLowerCase().replace(/ /g, '-')}`.slice(0, 36),
          title: doc.title,
          fileType: doc.type === 'PDF' ? 'application/pdf' : (doc.type === 'DOCX' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain'),
          sizeBytes: doc.size,
          userId: user.id,
          versions: {
            create: {
              version: 1,
              storageKey: `/uploads/${user.id}/${doc.title}.${doc.type.toLowerCase()}`,
              storageType: 'LOCAL',
              originalName: `${doc.title.toLowerCase().replace(/ /g, '_')}.${doc.type.toLowerCase()}`
            }
          }
        },
      });
      docCount++;
    }
  }
  console.log(`  ✅ ${docCount} sample documents created\n`);

  console.log('🎉 Seeding complete!\n');
  console.log('Demo credentials:');
  console.log('  admin@demo.com    / Demo@1234  (ADMIN)');
  console.log('  manager@demo.com  / Demo@1234  (MANAGER)');
  console.log('  analyst@demo.com  / Demo@1234  (ANALYST)');
}

seed()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
