import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  OTP_EXPIRY: z.coerce.number().default(300),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('Invalid environment variables:', parseResult.error.format());
  process.exit(1);
}

export const config = {
  env: parseResult.data.NODE_ENV,
  port: parseResult.data.PORT,
  db: {
    postgresUrl: parseResult.data.DATABASE_URL,
    mongoUri: parseResult.data.MONGODB_URI,
    redisUrl: parseResult.data.REDIS_URL,
  },
  jwt: {
    secret: parseResult.data.JWT_SECRET,
    refreshSecret: parseResult.data.JWT_REFRESH_SECRET,
    accessTokenExpiry: '15m', // 15 minutes
    refreshTokenExpiry: '7d', // 7 days
  },
  auth: {
    otpExpiry: parseResult.data.OTP_EXPIRY,
    otpMaxAttempts: 5,
    rateLimitOtpWindow: 3600, // 1 hour in seconds
    rateLimitOtpMax: 3, // 3 requests per window
  },
};

export default config;
