/**
 * Stripe client configuration. The publishable key comes from the EAS environment
 * (development/preview use pk_test_, production uses pk_live_).
 */
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

export const IS_STRIPE_TEST_MODE = STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_');

export const STRIPE_MERCHANT_IDENTIFIER = 'merchant.store.neighborfood';

export const STRIPE_URL_SCHEME = 'neighborfood';

export const STRIPE_RETURN_URL = `${STRIPE_URL_SCHEME}://stripe-redirect`;

if (__DEV__ && STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_')) {
  // Real cards would be charged from a debug build; fail loudly instead.
  throw new Error(
    'A live Stripe key is configured in a development build. Use a pk_test_ key for development.'
  );
}
