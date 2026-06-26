import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Strongly-typed environment configuration schema.
 * All required variables are validated at startup — the app will refuse
 * to start if any required variable is missing or malformed.
 */
const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),

  // Database
  DATABASE_URL: z
    .string({ message: 'DATABASE_URL is required' })
    .url('DATABASE_URL must be a valid connection string'),

  // Auth — JWT secrets must be at least 32 characters for security
  JWT_SECRET: z
    .string({ message: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_REFRESH_SECRET: z
    .string({ message: 'JWT_REFRESH_SECRET is required' })
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security'),

  // External services (optional, with defaults)
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  QDRANT_URL: z.string().url().default('http://localhost:6333'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('\n❌  Environment validation failed. Missing or invalid variables:\n');
  _env.error.issues.forEach((e: any) => {
    console.error(`   • ${e.path.join('.')}: ${e.message}`);
  });
  console.error('\n   Please check your .env file against .env.example\n');
  process.exit(1);
}

export const env = _env.data;
