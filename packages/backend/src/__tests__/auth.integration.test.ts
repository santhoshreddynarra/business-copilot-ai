import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import { prisma } from '../utils/prisma';

describe('Authentication & RBAC Integration Tests', () => {
  let accessToken: string;
  let testUserEmail = 'test@example.com';
  let testUserPassword = 'password123';

  beforeAll(async () => {
    // Clear out test user if exists
    await prisma.user.deleteMany({ where: { email: testUserEmail } });
  });

  afterAll(async () => {
    // Clean up
    await prisma.user.deleteMany({ where: { email: testUserEmail } });
    await prisma.$disconnect();
  });

  describe('Auth Flow', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUserEmail,
          password: testUserPassword,
          name: 'Test User'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe(testUserEmail);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should login an existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      accessToken = res.body.data.accessToken; // Save for next tests
    });

    it('should get current user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testUserEmail);
      expect(res.body.data.role.name).toBe('GUEST'); // Default role should be assigned
    });

    it('should fail to access protected route without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('RBAC & Tenant Isolation', () => {
    it('should block non-admins from admin routes', async () => {
      const res = await request(app)
        .delete('/api/documents/some-id') // Requires ADMIN role
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(403);
    });

    it('should block non-managers from upload routes', async () => {
      const res = await request(app)
        .post('/api/documents/upload') // Requires ADMIN or MANAGER
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('test'), 'test.txt');
        
      expect(res.status).toBe(403);
    });
  });
});
