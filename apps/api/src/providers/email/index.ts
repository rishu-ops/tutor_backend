import config from '../../config/index.js';
import { EmailProvider } from './email-provider.js';
import { MockEmailProvider } from './mock-email.provider.js';
import { ResendEmailProvider } from './resend-email.provider.js';
import { GmailEmailProvider } from './gmail-email.provider.js';
import { logger } from 'logger';

export * from './email-provider.js';
export * from './mock-email.provider.js';
export * from './resend-email.provider.js';
export * from './gmail-email.provider.js';

// OTP delivery for login runs through email. In production this requires a
// real RESEND_API_KEY (resend.com has a free tier — 3,000 emails/month, no
// domain verification needed if you use the default onboarding@resend.dev
// sender), or GMAIL_USER + GMAIL_APP_PASSWORD as a free fallback that can
// deliver to any recipient without domain verification. Set
// ALLOW_MOCK_EMAIL=true to explicitly bypass this for now — OTPs will only
// show up in server logs, never actually delivered.
export function createEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (apiKey) {
    return new ResendEmailProvider(apiKey, process.env.RESEND_FROM_EMAIL);
  }

  if (gmailUser && gmailAppPassword) {
    return new GmailEmailProvider(gmailUser, gmailAppPassword);
  }

  if (config.env === 'production') {
    if (process.env.ALLOW_MOCK_EMAIL !== 'true') {
      throw new Error(
        'No real email provider is configured for production. Set RESEND_API_KEY (resend.com has a free tier), or GMAIL_USER + GMAIL_APP_PASSWORD (free, no domain verification needed), or set ALLOW_MOCK_EMAIL=true to explicitly allow the mock provider for now (OTPs will only be visible in server logs, never delivered by email).'
      );
    }
    logger.warn(
      'ALLOW_MOCK_EMAIL is enabled — no real email is being sent. OTPs are only visible in server logs. Do not point real users at this deployment.'
    );
  }

  return new MockEmailProvider();
}
