// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import { prisma } from '../utils/prisma';
import bcrypt from 'bcrypt';

describe('Authentication Workflow E2E', () => {
  // Use a unique email per test run to avoid collisions
  const testEmail = `e2e-${Date.now()}@demo.com`;
  const testPassword = 'Password@123';
  const testName = 'E2E Test User';

  let registeredUserId: string;
  let registeredRefreshToken: string;

  afterAll(async () => {
    // Clean up: delete sessions first (FK constraint), then user
    if (registeredUserId) {
      await prisma.session.deleteMany({ where: { userId: registeredUserId } });
      await prisma.document.deleteMany({ where: { userId: registeredUserId } });
      await prisma.searchHistory.deleteMany({ where: { userId: registeredUserId } });
      await prisma.user.delete({ where: { id: registeredUserId } });
    }
    await prisma.$disconnect();
  });

  it('1. Register → User saved in database with hashed password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, name: testName });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    registeredUserId = res.body.data.user.id;

    // Verify user exists in DB
    const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(dbUser).not.toBeNull();
    expect(dbUser!.id).toBe(registeredUserId);
  });

  it('2. Password hashed correctly (not stored in plaintext)', async () => {
    const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(dbUser).not.toBeNull();

    // Plaintext must not be stored
    expect(dbUser!.passwordHash).not.toBe(testPassword);

    // bcrypt.compare must verify the correct password
    const isValid = await bcrypt.compare(testPassword, dbUser!.passwordHash);
    expect(isValid).toBe(true);

    // Wrong password must fail
    const isInvalid = await bcrypt.compare('WrongPassword@999', dbUser!.passwordHash);
    expect(isInvalid).toBe(false);
  });

  it('3. Login → JWT generated → Refresh token created → Session in DB', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testEmail);

    // Access token issued
    expect(res.body.data.accessToken).toBeDefined();

    // Refresh token issued
    expect(res.body.data.refreshToken).toBeDefined();
    registeredRefreshToken = res.body.data.refreshToken;

    // Session was persisted to DB
    const session = await prisma.session.findUnique({
      where: { token: registeredRefreshToken },
    });
    expect(session).not.toBeNull();
    expect(session!.userId).toBe(registeredUserId);
  });

  it('4. Wrong password → Invalid credentials (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'WrongPassword@999' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid credentials');
  });

  it('5. Protected /me route works with valid access token', async () => {
    // First get a fresh token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    const accessToken = loginRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('6. Protected /me route rejects missing token (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
