import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: { code: 403, message: 'Forbidden' } });
      }

      (req as any).user = user;
      next();
    });
  } else {
    res.status(401).json({ error: { code: 401, message: 'Unauthorized' } });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userReq = req as any;
    if (!userReq.user) {
      return res.status(401).json({ error: { code: 401, message: 'Unauthorized' } });
    }

    if (!roles.includes(userReq.user.role.name)) {
      return res.status(403).json({ error: { code: 403, message: 'Forbidden: Insufficient permissions' } });
    }

    next();
  };
};
