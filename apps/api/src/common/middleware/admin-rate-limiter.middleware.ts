import { Request, Response, NextFunction } from 'express';
import { redis } from 'database';

export const adminRateLimiter = (limit: number = 5, windowSec: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const rateLimitKey = `rate-limit:admin-login:${ip}`;

    try {
      const attemptsStr = await redis.get(rateLimitKey);
      const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;

      if (attempts >= limit) {
        res.status(429).json({
          success: false,
          error: 'Too many authentication attempts. Please try again later.',
        });
        return;
      }

      if (attempts === 0) {
        await redis.set(rateLimitKey, '1', 'EX', windowSec);
      } else {
        await redis.incr(rateLimitKey);
      }

      return next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fallback: bypass on Redis errors so application availability isn't blocked
      return next();
    }
  };
};
