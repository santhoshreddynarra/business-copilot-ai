// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

/**
 * Unit tests for AuthService
 * Mocks all Prisma and bcrypt calls — no real DB connection needed.
 */

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock('../utils/prisma', () => ({ prisma: mockPrisma }));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password') as any,
  compare: jest.fn() as any,
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token') as any,
  verify: jest.fn() as any,
}));

import bcrypt from 'bcrypt';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── register ──────────────────────────────────────────────────────────────
  describe('register()', () => {
    it('should throw if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'exists@test.com' } as any);
      mockPrisma.role.upsert.mockResolvedValue({} as any);

      await expect(
        authService.register('exists@test.com', 'Password1', 'Test')
      ).rejects.toThrow('Email already registered');
    });

    it('should create an ADMIN for the first user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.role.upsert.mockResolvedValue({} as any);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'admin-role-id', name: 'ADMIN' } as any);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'first@test.com',
        name: 'First',
        role: { name: 'ADMIN' },
      } as any);
      mockPrisma.session.create.mockResolvedValue({} as any);

      const result = await authService.register('first@test.com', 'Password1', 'First');

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: 'first@test.com' }) })
      );
      expect(result.user.role).toBe('ADMIN');
    });

    it('should create a MANAGER for subsequent users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(5); // Not the first user
      mockPrisma.role.upsert.mockResolvedValue({} as any);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'manager-role-id', name: 'MANAGER' } as any);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'second@test.com',
        name: 'Second',
        role: { name: 'MANAGER' },
      } as any);
      mockPrisma.session.create.mockResolvedValue({} as any);

      const result = await authService.register('second@test.com', 'Password1', 'Second');
      expect(result.user.role).toBe('MANAGER');
    });

    it('should hash password before storing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.role.upsert.mockResolvedValue({} as any);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', name: 'MANAGER' } as any);
      mockPrisma.user.create.mockResolvedValue({
        id: 'u1', email: 'test@test.com', name: 'Test', role: { name: 'MANAGER' },
      } as any);
      mockPrisma.session.create.mockResolvedValue({} as any);

      await authService.register('test@test.com', 'RawPassword1', 'Test');
      expect(bcrypt.hash).toHaveBeenCalledWith('RawPassword1', 10);
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────
  describe('login()', () => {
    it('should throw Invalid credentials if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login('notfound@test.com', 'password')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw Invalid credentials if password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'test@test.com', passwordHash: 'hash', role: { name: 'ANALYST' },
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false as never);

      await expect(authService.login('test@test.com', 'wrong-password')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should return tokens on successful login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'test@test.com', name: 'Test', passwordHash: 'hash', role: { name: 'ANALYST' },
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);
      mockPrisma.session.create.mockResolvedValue({} as any);

      const result = await authService.login('test@test.com', 'correct-password');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────
  describe('logout()', () => {
    it('should delete the session on logout', async () => {
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 } as any);

      const result = await authService.logout('some-refresh-token');
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { token: 'some-refresh-token' },
      });
      expect(result).toBe(true);
    });
  });

  // ── getMe ─────────────────────────────────────────────────────────────────
  describe('getMe()', () => {
    it('should return user profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'test@test.com', name: 'Test', role: { name: 'ANALYST' },
      } as any);

      const user = await authService.getMe('u1');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' } })
      );
      expect(user).toBeDefined();
    });
  });
});
