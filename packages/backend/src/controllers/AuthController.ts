import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: { code: 400, message: 'Email and password are required' } });
      }

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
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: { code: 400, message: 'Email and password are required' } });
      }

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
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: { code: 400, message: 'Refresh token is required' } });
      }

      const result = await authService.refresh(refreshToken);
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
