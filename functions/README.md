# Firebase Cloud Functions for Neighborfood

This directory contains Firebase Cloud Functions that handle Firestore operations for the Neighborfood application.

## Architecture

Following Firebase best practices:

### Client-Side Operations (Remain in the app)

- **Authentication**: Login, register, logout - Firebase recommends these stay client-side for direct token management and OAuth flow handling
- **Storage Uploads**: File uploads require direct client access to files

### Cloud Functions (Server-Side)

All Firestore operations are handled via Cloud Functions for:

- Better security through server-side validation
- Reduced client-side bundle size
- Centralized business logic
- User permission verification

## Prerequisites

1. **Firebase CLI**: Already installed as a dependency (`firebase-tools`)
2. **Node.js 20**: Functions are configured to run on Node.js 20
3. **Firebase Project**: You need a Firebase project with Firestore and Authentication enabled

## Setup

### 1. Authenticate with Firebase

From the project root directory:

```bash
npx firebase login
```

This will open a browser window to authenticate with your Google account.

### 2. Link Your Firebase Project

Create a `.firebaserc` file in the project root (copy from `.firebaserc.example`):

```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

Replace `YOUR_FIREBASE_PROJECT_ID` with your actual Firebase project ID.

### 3. Install Dependencies

```bash
cd functions
npm install
```

### 4. Build the Functions

```bash
npm run build
```

### 5. Deploy

From the project root directory:

```bash
npx firebase deploy --only functions
```

Or from the functions directory:

```bash
cd ..
npx firebase deploy --only functions
```

## Available Functions

### Generic Document Operations

- `getDocument` - Get a shop or item by ID, or the caller's own profile
- `isUsernameAvailable` - Check whether a username can be claimed
- `addDocument` - Create the caller's profile (`users/{uid}`)
- `updateDocument` - Update allowlisted fields on the caller's profile

### Shop Operations

- `createShopForUser` - Create a shop and link it to a user
- `updateShopDetails` - Update shop information
- `getShopsAndItemsForUser` - Get all shops and items for a user
- `getItemsForShop` - Get all items for a shop
- `getShopsForMarket` - Get shops in a market
- `getShopsByZipCodePrefix` - Get shops near a ZIP code
- `getShopsForUser` - Get all shops owned by a user

### Item Operations

- `createItemForShop` - Create an item for a shop
- `getItemById` - Get a single item
- `getAllItemsForUser` - Get all items for a user
- `updateItemQuantity` - Update item stock quantity

### Order Operations

- `createOrder` - Create a new order
- `getOrdersFromUser` - Get orders placed by a user
- `getOrdersForShop` - Get orders for a shop
- `updateOrderStatus` - Update order status
- `getOrdersForUser` - Get all orders (placed and received)
- `getOrder` - Get a specific order

### User Operations

- `getUserById` - Get a user's public profile (username, first name, photo)
- `deleteAccount` - Permanently delete the caller's account (requires a recent sign-in)

### Moderation & Community

- `submitReport` - Report a shop, item, user, order, message or general problem
- `blockUser` / `unblockUser` / `getBlockedUsers` - Manage blocked users
- `getCommunityStats` - Member count for a market (community unlock progress)

### Scheduled

- `autoReleaseEscrow` - Daily; pays sellers for orders completed 7+ days ago

## Development

### Local Testing (Emulators)

From the repo root:

```bash
npm run emulators
```

This builds the functions and starts the Auth, Firestore, Functions and Storage
emulators (ports in `firebase.json`). Point the app at them by setting
`EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true` in `.env` (debug builds only). On a physical
device also set `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` to your computer's LAN IP. Emulated
Auth/Firestore start empty, so register new test accounts.

### Testing Stripe in development

Use Stripe **test mode** keys everywhere outside production. No real money moves.

1. **App:** set `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` in `.env` (and in the
   EAS `development` and `preview` environments). Debug builds refuse to start with a
   `pk_live_` key, and checkout shows a test-mode banner.
2. **Functions in the emulator:** copy `functions/.secret.local.example` to
   `functions/.secret.local` and fill in `STRIPE_SECRET_KEY=sk_test_...`.
3. **Webhooks:** install the [Stripe CLI](https://docs.stripe.com/stripe-cli), run
   `stripe login`, then forward events to the emulated webhook:

   ```bash
   npm run stripe:listen -- http://localhost:5001/<project-id>/us-central1/stripeWebhook
   ```

   Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET` in `functions/.secret.local`
   and restart the emulators.

4. **Pay** with [test cards](https://docs.stripe.com/testing), e.g. `4242 4242 4242 4242`
   (success), `4000 0025 0000 3155` (3D Secure), `4000 0000 0000 9995` (declined).
5. **Seller onboarding:** with an `sk_test_` key, `createConnectedAccount` pre-fills
   Stripe's test identity values so payouts work without real KYC details.

For a shared staging backend, create a separate Firebase project (alias `dev` in
`.firebaserc`, see `.firebaserc.example`) and set its secrets to test keys:

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY --project dev       # sk_test_...
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project dev   # test endpoint whsec_...
firebase deploy --only functions --project dev
```

Production (`--project prod`) uses the live `sk_live_`/`whsec_` values and the EAS
`production` environment uses `pk_live_`.

### View Logs

```bash
npm run logs
```

## Security

All Cloud Functions verify user authentication and enforce permission rules:

- Users can only access their own data
- Shop owners can only modify their own shops
- Order operations verify both customer and shop owner permissions

## Troubleshooting

### "Permission denied" errors

- Ensure the user is authenticated before calling functions
- Check that the user has the correct permissions for the operation

### "Function not found" errors

- Make sure you've deployed the functions with `firebase deploy --only functions`
- Check that the function name matches exactly (case-sensitive)

### Build errors

- Run `npm run build` in the functions directory to check for TypeScript errors
- Ensure all dependencies are installed with `npm install`
