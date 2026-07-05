import { SmsProvider } from './sms-provider.js';
import { logger } from 'logger';

export class MockSmsProvider implements SmsProvider {
  async sendSms(to: string, message: string): Promise<boolean> {
    logger.info(`[SMS MOCK] To: ${to} | Message: ${message}`);
    return true;
  }
}
