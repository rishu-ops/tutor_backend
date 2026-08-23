import config from '../../config/index.js';
import { SmsProvider } from './sms-provider.js';
import { MockSmsProvider } from './mock-sms.provider.js';
import { logger } from 'logger';

export * from './sms-provider.js';
export * from './mock-sms.provider.js';

// No real SMS gateway (Twilio, MSG91, etc.) is wired up yet. Failing loudly at
// startup in production is deliberate: silently mocking OTP delivery means no
// user could ever actually log in, with nothing in the logs to explain why.
// Set ALLOW_MOCK_SMS=true to explicitly opt into the mock provider anyway —
// e.g. for a demo/testing deployment with no real users yet. OTPs will only
// ever show up in server logs, never delivered by real SMS.
export function createSmsProvider(): SmsProvider {
  if (config.env === 'production') {
    if (process.env.ALLOW_MOCK_SMS !== 'true') {
      throw new Error(
        'No real SMS provider is configured for production. Wire a real gateway, or set ALLOW_MOCK_SMS=true to explicitly allow the mock provider for now (OTPs will only be visible in server logs, never sent by real SMS).'
      );
    }
    logger.warn(
      'ALLOW_MOCK_SMS is enabled — no real SMS is being sent. OTPs are only visible in server logs. Do not point real users at this deployment.'
    );
  }
  return new MockSmsProvider();
}
