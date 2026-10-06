import { EmailProvider } from './email-provider.js';
import { logger } from 'logger';

// Resend's REST API directly — no SDK dependency needed. FROM_EMAIL defaults to
// Resend's own shared test sender (onboarding@resend.dev), which works without
// verifying a custom domain; swap it once you've verified your own domain.
export class ResendEmailProvider implements EmailProvider {
  constructor(
    private apiKey: string,
    private fromEmail: string = 'onboarding@resend.dev'
  ) {}

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to: [to],
        subject,
        text: body,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      logger.error(`[Resend] Failed to send email to ${to}: ${res.status} ${errorText}`);
      return false;
    }

    return true;
  }
}
