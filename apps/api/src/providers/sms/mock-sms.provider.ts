import { SmsProvider } from './sms-provider.js';
import { logger } from 'logger';

export class MockSmsProvider implements SmsProvider {
  async sendSms(to: string): Promise<boolean> {
    // Never log message content here — it carries the OTP. Dev/test callers
    // that need the code should read it from the sendOtp API response instead.
    logger.info(`[SMS MOCK] Pretending to send SMS to ${to} (no real gateway configured)`);
    return true;
  }
}
