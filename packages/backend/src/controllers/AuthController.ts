import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { registerSchema, loginSchema, refreshSchema } from '../validators/authValidator';
import { ZodError } from 'zod';
import axios from 'axios';

const authService = new AuthService();

/** Helper: format Zod errors into a readable message */
function formatZodError(err: ZodError): string {
  return err.issues.map((e: any) => e.message).join(', ');
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
      const userReq = req as any;
      if (!userReq.user) {
        return res.status(401).json({ error: { code: 401, message: 'Unauthorized' } });
      }
      const user = await authService.getMe(userReq.user.id);
      res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  static async googleAuth(req: Request, res: Response, next: NextFunction) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: { code: 500, message: 'Google OAuth is not configured' } });
    }
    const redirectUri = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/callback` : 'http://localhost:4000/api/auth/google/callback';
    const scope = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    res.redirect(authUrl);
  }

  static async googleAuthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).json({ error: { code: 400, message: 'No code provided' } });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/callback` : 'http://localhost:4000/api/auth/google/callback';

      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: { code: 500, message: 'Google OAuth is not configured' } });
      }

      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      const { access_token } = tokenResponse.data;

      const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const profile = profileResponse.data;

      const result = await authService.googleLogin({
        id: profile.id,
        email: profile.email,
        name: profile.name,
      });

      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`);
    } catch (error: any) {
      console.error('Google OAuth Error:', error.response?.data || error.message);
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
}
