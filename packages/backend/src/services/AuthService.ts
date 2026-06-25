import { prisma } from '../utils/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export class AuthService {
  async register(email: string, passwordHashRaw: string, name: string) {
    // Determine role (default to VIEWER if not specified, but let's just use first user as ADMIN, others as MANAGER for now, or ensure roles exist)
    await this.ensureRolesExist();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Email already registered');

    // Make the first user an ADMIN, subsequent users a MANAGER
    const userCount = await prisma.user.count();
    const roleName = userCount === 0 ? 'ADMIN' : 'MANAGER';
    const role = await prisma.role.findUnique({ where: { name: roleName } });

    if (!role) throw new Error('Role setup failed');

    const passwordHash = await bcrypt.hash(passwordHashRaw, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        roleId: role.id,
      },
      include: { role: true },
    });

    return this.generateTokens(user);
  }

  async login(email: string, passwordRaw: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) throw new Error('Invalid credentials');

    const isValid = await bcrypt.compare(passwordRaw, user.passwordHash);
    if (!isValid) throw new Error('Invalid credentials');

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string) {
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { role: true } } },
    });

    if (!session) throw new Error('Invalid refresh token');
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      throw new Error('Refresh token expired');
    }

    try {
      jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      
      // Revoke old session and issue new pair
      await prisma.session.delete({ where: { id: session.id } });
      return this.generateTokens(session.user);
    } catch (err) {
      await prisma.session.delete({ where: { id: session.id } });
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    await prisma.session.deleteMany({
      where: { token: refreshToken },
    });
    return true;
  }

  async getMe(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: { select: { name: true } } },
    });
  }

  private async generateTokens(user: any) {
    const payload = { id: user.id, email: user.email, role: { name: user.role.name } };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role.name },
      accessToken,
      refreshToken,
    };
  }

  private async ensureRolesExist() {
    const roles = ['ADMIN', 'MANAGER', 'ANALYST', 'VIEWER'];
    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role },
        update: {},
        create: { name: role, description: `${role} role` },
      });
    }
  }
}
