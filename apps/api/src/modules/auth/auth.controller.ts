import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { sendOtpSchema, verifyOtpSchema, refreshSchema } from './auth.validation.js';
import { setRefreshCookie, clearRefreshCookie } from '../../common/utils/cookie.util.js';

const REFRESH_COOKIE = 'pt_refresh_token';

export class AuthController {
  private service = new AuthService();

  // Helper to extract request metadata
  private getRequestMeta(req: Request) {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.socket.remoteAddress || '';

    let deviceName = 'Unknown Device';
    if (userAgent.includes('Mobi')) deviceName = 'Mobile Device';
    else if (userAgent.includes('Windows')) deviceName = 'Windows PC';
    else if (userAgent.includes('Macintosh')) deviceName = 'macOS Device';
    else if (userAgent.includes('Linux')) deviceName = 'Linux Device';

    return {
      userAgent,
      ipAddress,
      deviceName,
    };
  }

  // POST /send-otp
  async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = sendOtpSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ success: false, errors: parseResult.error.format() });
        return;
      }

      const { phone, email } = parseResult.data;
      const otp = await this.service.sendOtp(phone, email);

      const responseData: Record<string, any> = { success: true, message: 'OTP sent successfully' };
      if (process.env.NODE_ENV === 'development') {
        responseData.otp = otp;
      }
      res.json(responseData);
    } catch (error) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const status = err.statusCode || 500;
      res.status(status).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  // POST /verify-otp
  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = verifyOtpSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ success: false, errors: parseResult.error.format() });
        return;
      }

      const { phone, otp } = parseResult.data;
      const meta = this.getRequestMeta(req);

      const result = await this.service.verifyOtp(phone, otp, meta);
      setRefreshCookie(res, REFRESH_COOKIE, result.refreshToken);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const status = err.statusCode || 500;
      res.status(status).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  // POST /refresh
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const cookieToken = req.cookies?.[REFRESH_COOKIE];
      const parseResult = refreshSchema.safeParse({
        refreshToken: cookieToken || req.body?.refreshToken,
      });
      if (!parseResult.success) {
        res.status(400).json({ success: false, errors: parseResult.error.format() });
        return;
      }

      const { refreshToken } = parseResult.data;
      const meta = this.getRequestMeta(req);

      const tokens = await this.service.refreshSession(refreshToken, meta);
      setRefreshCookie(res, REFRESH_COOKIE, tokens.refreshToken);
      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const status = err.statusCode || 401;
      res.status(status).json({ success: false, error: err.message || 'Authentication failed' });
    }
  }

  // POST /logout
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
      if (refreshToken) {
        await this.service.logout(refreshToken);
      }
      clearRefreshCookie(res, REFRESH_COOKIE);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch {
      clearRefreshCookie(res, REFRESH_COOKIE);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
