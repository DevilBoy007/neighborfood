// Loaded before each test file (see jest.config.js). Values here are dummies for the
// offline emulator project; emulator hosts are injected by `firebase emulators:exec`.
process.env.GCLOUD_PROJECT ??= 'demo-neighborfood';
process.env.FIREBASE_CONFIG ??= JSON.stringify({
  projectId: 'demo-neighborfood',
  storageBucket: 'neighborfoods',
});
process.env.STRIPE_SECRET_KEY ??= 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET ??= 'whsec_dummy';
process.env.REVENUECAT_SECRET_API_KEY ??= 'sk_revenuecat_dummy';
process.env.REVENUECAT_WEBHOOK_AUTH ??= 'test-webhook-auth';
process.env.ADMIN_EMAIL ??= 'admin@example.com';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Run these tests through the emulators: npm run test:emulators');
}
