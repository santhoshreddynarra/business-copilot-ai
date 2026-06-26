import { z } from 'zod';

/**
 * Zod schema for user registration.
 * Enforces email format and minimum password strength.
 */
export const registerSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .optional(),
});

/**
 * Zod schema for user login.
 */
export const loginSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: 'Password is required' })
    .min(1, 'Password is required'),
});

/**
 * Zod schema for token refresh.
 */
export const refreshSchema = z.object({
  refreshToken: z
    .string({ message: 'Refresh token is required' })
    .min(1, 'Refresh token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
