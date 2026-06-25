import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Centralized Express error handler middleware.
 * Handles known error types with appropriate HTTP status codes.
 * Must be registered LAST in the middleware chain (after all routes).
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Already sent a response — let Express handle
  if (res.headersSent) {
    return next(err);
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 400,
        type: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // Prisma unique constraint violation (e.g., duplicate email)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: {
          code: 409,
          type: 'CONFLICT',
          message: 'A record with this value already exists',
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        error: {
          code: 404,
          type: 'NOT_FOUND',
          message: 'The requested record was not found',
        },
      });
      return;
    }
  }

  // Prisma connection errors
  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error('[DB] Connection error:', err.message);
    res.status(503).json({
      error: {
        code: 503,
        type: 'SERVICE_UNAVAILABLE',
        message: 'Database connection failed',
      },
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: {
        code: 401,
        type: 'UNAUTHORIZED',
        message: err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token',
      },
    });
    return;
  }

  // File upload errors (Multer)
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      error: {
        code: 413,
        type: 'PAYLOAD_TOO_LARGE',
        message: 'File size exceeds the 50MB limit',
      },
    });
    return;
  }

  // Fallback: Internal Server Error
  const statusCode = err.statusCode || err.status || 500;
  console.error(`[${statusCode}] ${req.method} ${req.path}:`, err.message || err);

  res.status(statusCode).json({
    error: {
      code: statusCode,
      type: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message || 'Internal Server Error',
    },
  });
};
