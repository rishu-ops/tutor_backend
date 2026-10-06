import { EmailProvider } from './email-provider.js';
import { logger } from 'logger';

export class MockEmailProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    logger.info(`[EMAIL MOCK] To: ${to} | Subject: ${subject} | Body: ${body}`);
    return true;
  }
}
