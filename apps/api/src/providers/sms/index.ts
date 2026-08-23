import config from '../../config/index.js';
import { SmsProvider } from './sms-provider.js';
import { MockSmsProvider } from './mock-sms.provider.js';

export * from './sms-provider.js';
export * from './mock-sms.provider.js';

// No real SMS gateway (Twilio, MSG91, etc.) is wired up yet. Failing loudly at
// startup in production is deliberate: silently mocking OTP delivery means no
// user could ever actually log in, with nothing in the logs to explain why.
export function createSmsProvider(): SmsProvider {
  if (config.env === 'production') {
    throw new Error(
      'No real SMS provider is configured for production. MockSmsProvider must never be used outside development/test — wire a real gateway before deploying.'
    );
  }
  return new MockSmsProvider();
}
