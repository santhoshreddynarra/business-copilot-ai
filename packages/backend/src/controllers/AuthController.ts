import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { registerSchema, loginSchema, refreshSchema } from '../validators/authValidator';
import { ZodError } from 'zod';

const authService = new AuthService();

/** Helper: format Zod errors into a readable message */
function formatZodError(err: ZodError): string {
  return err.errors.map(e => e.message).join(', ');
}

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: { code: 400, message: formatZodError(parsed.error) } });
      }
      const { email, password, name } = parsed.data;
      const result = await authService.register(email, password, name || email.split('@')[0]);
      res.status(201).json({ data: result });
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        return res.status(409).json({ error: { code: 409, message: error.message } });
      }
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: { code: 400, message: formatZodError(parsed.error) } });
      }
      const { email, password } = parsed.data;
      const result = await authService.login(email, password);
      res.status(200).json({ data: result });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: { code: 401, message: error.message } });
      }
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = refreshSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: { code: 400, message: formatZodError(parsed.error) } });
      }
      const result = await authService.refresh(parsed.data.refreshToken);
      res.status(200).json({ data: result });
    } catch (error: any) {
      return res.status(401).json({ error: { code: 401, message: error.message } });
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.status(200).json({ data: { success: true } });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 401, message: 'Unauthorized' } });
      }
      const user = await authService.getMe(req.user.id);
      res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  }
}
