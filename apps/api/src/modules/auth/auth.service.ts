import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { redis } from 'database';
import config from '../../config/index.js';
import { AuthRepository } from './auth.repository.js';
import { generateOtp } from '../../common/utils/otp.util.js';
import { MockSmsProvider } from '../../providers/sms/mock-sms.provider.js';
import { AuthError } from './auth.errors.js';

export class AuthService {
  private repository = new AuthRepository();
  private smsProvider = new MockSmsProvider();

  // Hash helper
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // 1. Send OTP
  async sendOtp(phone: string): Promise<string> {
    const rateLimitKey = `rate-limit:otp:${phone}`;
    const otpKey = `otp:${phone}`;

    // Rate Limiting Check
    const attemptsStr = await redis.get(rateLimitKey);
    let attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;

    if (attempts >= config.auth.rateLimitOtpMax) {
      throw new AuthError('Too many OTP requests. Please try again after an hour.', 429);
    }

    // Generate OTP
    const otp = generateOtp(config.auth.otpExpiry ? 6 : 6); // default 6

    // Store in Redis
    const otpData = {
      otp,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    // Save OTP (expires in config.auth.otpExpiry seconds)
    await redis.set(otpKey, JSON.stringify(otpData), 'EX', config.auth.otpExpiry);

    // Increment Rate Limit (expires in config.auth.rateLimitOtpWindow seconds = 1 hour)
    attempts += 1;
    if (attempts === 1) {
      await redis.set(rateLimitKey, '1', 'EX', config.auth.rateLimitOtpWindow);
    } else {
      await redis.incr(rateLimitKey);
    }

    // Send SMS (prints OTP to logger/console)
    const smsMessage = `Your project-tutor verification code is ${otp}. It expires in 5 minutes.`;
    await this.smsProvider.sendSms(phone, smsMessage);

    return otp;
  }

  // 2. Verify OTP & Login/Create User
  async verifyOtp(
    phone: string,
    otp: string,
    meta?: { deviceName?: string; ipAddress?: string; userAgent?: string }
  ) {
    const otpKey = `otp:${phone}`;

    // Get OTP details from Redis
    const storedDataStr = await redis.get(otpKey);
    if (!storedDataStr) {
      throw new AuthError('OTP has expired or is invalid. Please request a new one.', 400);
    }

    const storedData = JSON.parse(storedDataStr);

    // Check failed attempts limit (max 5 attempts)
    if (storedData.attempts >= config.auth.otpMaxAttempts) {
      await redis.del(otpKey);
      throw new AuthError('Too many failed OTP attempts. Please request a new one.', 400);
    }

    // Match OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      await redis.set(otpKey, JSON.stringify(storedData), 'KEEPTTL');
      throw new AuthError('Incorrect OTP verification code.', 400);
    }

    // Successfully verified -> Delete OTP key
    await redis.del(otpKey);

    // Find or create User
    let user = await this.repository.findUserByPhone(phone);
    if (!user) {
      user = await this.repository.createUser(phone);
    }

    if (!user.isActive) {
      throw new AuthError('Your account has been deactivated.', 403);
    }

    // Create session and generate tokens
    const { accessToken, refreshToken } = await this.createNewSession(user.id, meta);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  // Helper to establish a new session
  private async createNewSession(
    userId: string,
    meta?: { deviceName?: string; ipAddress?: string; userAgent?: string }
  ) {
    const rawRefreshToken = crypto.randomUUID();
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Save session in Postgres
    await this.repository.createSession({
      userId,
      refreshTokenHash,
      deviceName: meta?.deviceName || null,
      ipAddress: meta?.ipAddress || null,
      userAgent: meta?.userAgent || null,
      expiresAt,
    });

    // Sign Access Token (JWT)
    const accessToken = jwt.sign({ sub: userId }, config.jwt.secret, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: config.jwt.accessTokenExpiry as any,
    });

    // Sign Refresh Token (JWT contains raw ID to match back)
    const refreshToken = jwt.sign({ jti: rawRefreshToken }, config.jwt.refreshSecret, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: config.jwt.refreshTokenExpiry as any,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  // 3. Rotate Tokens (Refresh)
  async refreshSession(
    refreshToken: string,
    meta?: { deviceName?: string; ipAddress?: string; userAgent?: string }
  ) {
    try {
      // Verify JWT signature of the refresh token
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { jti: string };
      const rawRefreshToken = payload.jti;
      const hash = this.hashToken(rawRefreshToken);

      // Find session in PostgreSQL
      const session = await this.repository.findSessionByHash(hash);

      if (!session) {
        throw new AuthError('Session not found.', 401);
      }

      if (session.revokedAt) {
        throw new AuthError('Session has been revoked.', 401);
      }

      if (new Date() > session.expiresAt) {
        throw new AuthError('Session has expired.', 401);
      }

      // Revoke the old session (rotate refresh token)
      await this.repository.revokeSessionByHash(hash);

      // Create a brand new session
      const tokens = await this.createNewSession(session.userId, meta);

      return tokens;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Invalid refresh token.', 401);
    }
  }

  // 4. Logout
  async logout(refreshToken: string): Promise<boolean> {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { jti: string };
      const rawRefreshToken = payload.jti;
      const hash = this.hashToken(rawRefreshToken);

      await this.repository.revokeSessionByHash(hash);
      return true;
    } catch {
      // Fail silently for security/UX simplicity
      return false;
    }
  }
}
