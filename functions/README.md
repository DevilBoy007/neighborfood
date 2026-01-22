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

- `getDocument` - Get a single document by ID
- `getAllDocuments` - Get all documents from a collection
- `getDocumentsWhere` - Query documents with a where clause
- `addDocument` - Create a new document
- `updateDocument` - Update an existing document
- `deleteDocument` - Delete a document

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

- `getUserById` - Get user profile

## Development

### Local Testing (Emulators)

```bash
npm run serve
```

This will start the Firebase emulators for local testing.

### Linting

```bash
npm run lint
```

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
