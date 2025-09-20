# Firebase Functions for NeighborFood

This directory contains the Firebase Cloud Functions that handle server-side operations for the NeighborFood app.

## Setup

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase project (if not already done):
   ```bash
   firebase init
   ```

4. Install dependencies:
   ```bash
   cd functions
   npm install
   ```

## Available Functions

### Authentication
- `registerUser` - Creates new user accounts with input validation
- Uses Firebase Auth for user creation and Firestore for additional user data

### User Management
- `getUserById` - Retrieves user data (authenticated users only)

### Shop Management
- `getShopsForUser` - Get all shops owned by a user
- `getShopsByZipCodePrefix` - Get shops in a specific ZIP code area
- `createShopForUser` - Create a new shop for a user
- `updateShopDetails` - Update shop information

### Item Management
- `getItemsForShop` - Get all items for a specific shop
- `createItemForShop` - Add new items to a shop
- `getAllItemsForUser` - Get all items owned by a user

### Order Management
- `createOrder` - Create new orders
- `getOrdersFromUser` - Get orders placed by a user
- `getOrdersForShop` - Get orders received by a shop
- `updateOrderStatus` - Update order status (shop owners only)

## Security Features

- **Authentication validation**: All functions verify user authentication tokens
- **Input sanitization**: All inputs are sanitized before processing
- **Authorization checks**: Users can only access/modify their own data
- **Shop ownership validation**: Only shop owners can modify their shops and items

## Development

### Build functions:
```bash
npm run build
```

### Start local emulator:
```bash
npm run serve
```

### Deploy functions:
```bash
npm run deploy
```

## Error Handling

Functions return standardized responses:
```typescript
{
  success: boolean,
  data?: any,
  message?: string
}
```

Common error codes:
- `functions/unauthenticated` - No or invalid auth token
- `functions/permission-denied` - User lacks permission
- `functions/invalid-argument` - Invalid input data
- `functions/not-found` - Resource not found
- `functions/already-exists` - Resource already exists
- `functions/internal` - Server error

## Migration from Direct Firestore

The client-side `FirebaseService` has been updated to call these functions instead of directly accessing Firestore. This provides:

1. **Better security** - Server-side validation and authorization
2. **Input sanitization** - Prevents malicious data
3. **Centralized business logic** - Easier to maintain and update
4. **Rate limiting** - Built-in Firebase Functions rate limiting
5. **Monitoring** - Better observability and logging