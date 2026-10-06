import nodemailer, { Transporter } from 'nodemailer';
import { EmailProvider } from './email-provider.js';
import { logger } from 'logger';

const SEND_TIMEOUT_MS = 10_000;

// Free fallback when no Resend API key is configured — sends through a
// Gmail account via SMTP using an App Password (not the real account
// password; generate one under Google Account → Security → App Passwords).
// No domain verification required and it can deliver to any recipient,
// unlike Resend's unverified onboarding@resend.dev sender.
export class GmailEmailProvider implements EmailProvider {
  private transporter: Transporter;

  constructor(
    private user: string,
    appPassword: string
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: appPassword },
      connectionTimeout: SEND_TIMEOUT_MS,
      greetingTimeout: SEND_TIMEOUT_MS,
      socketTimeout: SEND_TIMEOUT_MS,
    });
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.user,
        to,
        subject,
        text: body,
      });
      return true;
    } catch (err) {
      logger.error(`[Gmail] Failed to send email to ${to}: ${(err as Error).message}`);
      return false;
    }
  }
}
