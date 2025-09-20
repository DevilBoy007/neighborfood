# Redux State Management

This directory contains the Redux store configuration and slices for the NeighborFood app. We've migrated from React Context providers to Redux Toolkit for better performance and maintainability.

## 🎉 Migration Complete!

We've successfully eliminated the "nesting hell" of 6 context providers and replaced them with a single, clean Redux store.

### Before vs After

**Before (Nesting Hell):**
```tsx
<OrderProvider>
  <UserProvider>
    <LocationProvider>
      <ShopProvider>
        <ItemProvider>
          <CartProvider>
            // App content buried 6 levels deep
          </CartProvider>
        </ItemProvider>
      </ShopProvider>
    </LocationProvider>
  </UserProvider>
</OrderProvider>
```

**After (Clean Redux):**
```tsx
<Provider store={store}>
  // Clean, readable app content
</Provider>
```

## Directory Structure

```
store/
├── index.ts          # Main store configuration
├── hooks.ts          # Compatibility hooks (same interface as old contexts)
├── slices/
│   ├── userSlice.ts      # User authentication & profile
│   ├── locationSlice.ts  # GPS, geocoding, distance formatting
│   ├── shopSlice.ts      # Shop selection & listings
│   ├── itemSlice.ts      # Item selection & loading
│   ├── orderSlice.ts     # Order management (placed/received/history)
│   └── cartSlice.ts      # Shopping cart with persistence
└── README.md         # This file
```

## Usage

### Option 1: Compatibility Hooks (Recommended for Migration)

Use the same interface as the old context hooks:

```tsx
import { useUser, useCart, useLocation, useShop, useItem, useOrder } from '@/store/hooks';

function MyComponent() {
  // Same interface as before!
  const { userData, isLoading, setUserData, clearUserData } = useUser();
  const { shopCarts, addToCart, removeFromCart } = useCart();
  const { locationData, fetchCurrentLocation } = useLocation();
  
  // ... rest of your component logic remains the same
}
```

### Option 2: Direct Redux Hooks (For New Components)

Use Redux hooks directly for more control:

```tsx
import { useAppSelector, useAppDispatch } from '@/store';
import { setSelectedShop } from '@/store/slices/shopSlice';
import { addToCart } from '@/store/slices/cartSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const userData = useAppSelector(state => state.user.userData);
  const shopCarts = useAppSelector(state => state.cart.shopCarts);
  
  const handleSelectShop = (shop) => {
    dispatch(setSelectedShop(shop));
  };
  
  const handleAddToCart = (item) => {
    dispatch(addToCart({
      item,
      shopId: 'shop-123',
      shopName: 'My Shop',
      allowPickup: true,
      localDelivery: true
    }));
  };
}
```

## State Domains

### User Slice (`userSlice.ts`)
- **State**: `userData`, `isLoading`
- **Actions**: `loadUserData`, `saveUserData`, `updateUserData`, `clearUserData`
- **Use case**: Authentication, user profile management

### Location Slice (`locationSlice.ts`)
- **State**: `coords`, `zipCode`, `area`, `loading`, `error`, `usesImperialSystem`
- **Actions**: `fetchCurrentLocation`, `updateLocation`
- **Use case**: GPS location, geocoding, distance calculations

### Shop Slice (`shopSlice.ts`)
- **State**: `selectedShop`, `shops`, `isLoadingShop`
- **Actions**: `setSelectedShop`, `clearSelectedShop`, `setShops`, `setIsLoadingShop`
- **Use case**: Shop browsing and selection

### Item Slice (`itemSlice.ts`)
- **State**: `selectedItem`, `isLoadingItem`
- **Actions**: `setSelectedItem`, `clearSelectedItem`, `setIsLoadingItem`
- **Use case**: Item selection and loading states

### Order Slice (`orderSlice.ts`)
- **State**: `placedOrders`, `receivedOrders`, `orderHistory`, `selectedOrder`, `isLoadingOrders`, `isInitialized`
- **Actions**: `initializeOrders`, `refreshOrders`, `addToPlacedOrders`, `updateOrderStatus`, etc.
- **Use case**: Order management for customers and shop owners

### Cart Slice (`cartSlice.ts`)
- **State**: `shopCarts`, `isLoadingCart`
- **Actions**: `loadCart`, `addToCart`, `removeFromCart`, `updateItemQuantity`, `clearCart`
- **Use case**: Shopping cart with persistence across sessions

## Benefits of Redux Migration

✅ **Performance**: Optimized re-renders with Redux selectors
✅ **Debugging**: Redux DevTools support for time-travel debugging
✅ **Maintainability**: Centralized state management
✅ **Scalability**: Easy to add new state domains
✅ **Type Safety**: Full TypeScript support
✅ **Testing**: Pure reducer functions are easy to test
✅ **Persistence**: Built-in async actions for data persistence

## Migration Guide

If you have components still using the old context imports:

1. **Replace context imports** with hook imports:
   ```tsx
   // Old
   import { useUser } from '@/context/userContext';
   
   // New
   import { useUser } from '@/store/hooks';
   ```

2. **Keep the same component logic** - the hook interface is identical!

3. **Remove old context files** once all components are migrated:
   - `context/userContext.tsx`
   - `context/locationContext.tsx`
   - `context/shopContext.tsx`
   - `context/itemContext.tsx`
   - `context/orderContext.tsx`
   - `context/cartContext.tsx`

## Development Notes

- All async actions are handled with Redux Toolkit's `createAsyncThunk`
- Data persistence (AsyncStorage/localStorage) is built into relevant slices
- TypeScript types are exported from slices for reuse
- The store is optimized for React Native and web platforms
- Middleware includes serialization checks for React Native compatibility

## Troubleshooting

**Common issues:**

1. **Import errors**: Make sure to use `@/store/hooks` for compatibility hooks
2. **Type errors**: Import types from the relevant slice files
3. **Persistence not working**: Check AsyncStorage permissions on mobile
4. **Performance issues**: Use `useAppSelector` with specific selectors instead of selecting the entire state

For more help, check the Redux Toolkit documentation: https://redux-toolkit.js.org/