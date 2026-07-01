import { AuthService } from '../src/services/AuthService';
import { prisma } from '../src/utils/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('../src/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    session: {
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    }
  }
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('googleLogin', () => {
    it('should create a new user if one does not exist', async () => {
      // Mock role setup
      (prisma.role.upsert as jest.Mock).mockResolvedValue({});
      (prisma.role.findUnique as jest.Mock).mockResolvedValue({ id: 'role-1', name: 'ADMIN' });
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      
      // Mock user not existing
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Mock user creation
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: { name: 'ADMIN' }
      };
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const profile = { id: 'google-123', email: 'test@example.com', name: 'Test User' };
      const result = await authService.googleLogin(profile);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: profile.email,
          name: profile.name,
          googleId: profile.id,
          roleId: 'role-1'
        },
        include: { role: true }
      });
      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should link googleId to existing user with same email', async () => {
      (prisma.role.upsert as jest.Mock).mockResolvedValue({});
      
      // First findUnique by googleId returns null
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        // Second findUnique by email returns existing user
        .mockResolvedValueOnce({ id: 'user-1', email: 'test@example.com', role: { name: 'MANAGER' } });

      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        googleId: 'google-123',
        role: { name: 'MANAGER' }
      };
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const profile = { id: 'google-123', email: 'test@example.com', name: 'Test User' };
      const result = await authService.googleLogin(profile);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { googleId: 'google-123' },
        include: { role: true }
      });
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    it('should throw error if user has no passwordHash', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: null,
        role: { name: 'ADMIN' }
      });

      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toThrow('Invalid credentials');
    });
  });
});
