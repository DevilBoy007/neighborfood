export const CardField = () => null;

const unavailable = async (..._args: unknown[]) => ({
  error: { message: 'Stripe is unavailable on web' },
});

export const useStripe = () => ({
  confirmSetupIntent: unavailable,
  initPaymentSheet: unavailable,
  presentPaymentSheet: unavailable,
});
