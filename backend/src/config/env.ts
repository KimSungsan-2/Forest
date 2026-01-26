import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),

  // Server
  PORT: z.string().transform(Number).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // CORS
  ALLOWED_ORIGINS: z.string().transform((val) => val.split(',')),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_TIMEWINDOW: z.string().default('1 hour'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const config = {
  databaseUrl: parsedEnv.data.DATABASE_URL,
  redisUrl: parsedEnv.data.REDIS_URL,
  jwtSecret: parsedEnv.data.JWT_SECRET,
  jwtExpiresIn: parsedEnv.data.JWT_EXPIRES_IN,
  anthropicApiKey: parsedEnv.data.ANTHROPIC_API_KEY,
  port: parsedEnv.data.PORT,
  nodeEnv: parsedEnv.data.NODE_ENV,
  allowedOrigins: parsedEnv.data.ALLOWED_ORIGINS,
  rateLimitMax: parsedEnv.data.RATE_LIMIT_MAX,
  rateLimitTimeWindow: parsedEnv.data.RATE_LIMIT_TIMEWINDOW,
};
