# Neighborfood - Copilot Agent Instructions

## Project Overview

**Neighborfood** is a React Native mobile application built with Expo that connects users with local food vendors. It's a food marketplace app where users can browse shops, order items, manage carts, and complete checkouts with location-based services.

### Tech Stack
- **Framework**: React Native 0.79.6 with Expo SDK 53
- **Language**: TypeScript 5.8.3
- **Routing**: Expo Router 5.1.10 (file-based routing)
- **Backend**: Firebase (Authentication, Storage, Firestore via Cloud Functions)
- **State Management**: Redux Toolkit with Redux Persist
- **Maps**: React Native Maps + Google Maps API (with web fallback using react-native-web-maps)
- **UI**: React Native with Expo components
- **Testing**: Jest with jest-expo preset
- **Build Tool**: Metro bundler

### Firebase Architecture
The app uses a hybrid Firebase architecture following best practices:

**Client-Side (in `handlers/firebaseService.tsx`):**
- **Authentication**: Login, register, logout remain client-side (Firebase recommendation for token management)
- **Storage**: File uploads use client-side SDK for direct file access
  - `uploadProductImage(file, shopId, itemId)` → `product_images/{shopId}/{itemId}/{filename}`
  - `uploadUserProfileImage(file, userId)` → `user_profile_images/{userId}/{filename}`

**Server-Side (in `functions/src/index.ts`):**
- All Firestore CRUD operations use Cloud Functions via `httpsCallable`
- Provides server-side validation and permission checks
- 30+ callable functions for shops, items, orders, users, and generic CRUD

**Deploying Cloud Functions:**
```bash
npx firebase login
cp .firebaserc.example .firebaserc  # add your project ID
cd functions && npm install && cd ..
npx firebase deploy --only functions
```

## Build & Run Instructions

### Prerequisites
- Node.js and npm (versions not specified in package.json)
- Expo CLI (installed via npx)
- For iOS: Xcode and iOS Simulator
- For Android: Android Studio and Android Emulator
- For Cloud Functions: Firebase CLI (installed as `firebase-tools` dependency)

### Installation
**Always run `npm install` before building or running the project.**
```bash
npm install
```

**Followed by `npx expo install` to ensure Expo-compatible versions of dependencies are installed.**
```bash
npx expo install
```

**Don't attempt to upgrade dependencies unless necessary to fix bugs or add critical features.**

### Development Commands
| Command | Description |
|---------|-------------|
| `npx expo install {package-name}` | Install a package with Expo-compatible version |
| `npx expo start` | Start Expo development server |
| `npx expo run android` | Run on Android emulator/device (requires pre-built native app) |
| `npx expo run ios` | Run on iOS simulator/device (requires pre-built native app) |
| `npx expo run web` | Run web version using Metro bundler |

### Important Notes
- The entry point is `index.js` which registers the app using expo-router
- Main app structure is in `app/` directory using file-based routing
- Use `npx expo start` to get options for opening in development build, emulator, or Expo Go

## Project Architecture

### Directory Structure
```
/app/                   # Main application code (file-based routing)
  /_layout.tsx          # Root layout with providers
  /index.tsx            # Home/landing screen
  /Login.tsx, /Register.tsx, /Settings.tsx, etc.
  /(home)/              # Home tab screens (Market, Menu)
  /(cart)/              # Cart screens
  /(checkout)/          # Checkout flow
  /(shops)/, /(items)/, /(orders)/, /(contact)/ # Sub-routes

/components/            # Reusable UI components
  /CartFAB.tsx, /ItemCard.tsx, /ShopCard.tsx, /OrderCard.tsx
  /MapScreen.tsx, /WebMapScreen.tsx, /GoogleMapsLoader.tsx
  /ThemedText.tsx, /ThemedView.tsx, /SafeView.tsx
  /SoundPressable.tsx, /SoundTouchableOpacity.tsx

/store/                 # Redux store configuration
  /store.ts             # Redux store with persist config
  /reduxHooks.ts        # Typed Redux hooks

/handlers/              # Service layer
  /firebaseService.tsx  # Firebase integration (auth, storage, Cloud Functions client)

/functions/             # Firebase Cloud Functions (Node.js)
  /src/index.ts         # All callable functions for Firestore operations
  /package.json         # Function dependencies (firebase-admin, firebase-functions)

/hooks/                 # Custom React hooks
  /useColorScheme.ts    # Theme detection
  /useSound.ts          # Sound effects
  /useOrderStatus.ts    # Order state management
  /useThemeColor.ts     # Theme color utilities

/constants/             # App constants
  /Colors.ts            # Color definitions

/assets/                # Static assets
  /fonts/, /images/, /mascot/, /sounds/, /legal/

/android/, /ios/        # Native platform code
/scripts/               # Build/utility scripts
  /reset-project.js     # Project reset utility
```

### Configuration Files
- **tsconfig.json**: TypeScript config with strict mode, path aliases (@/*)
- **babel.config.js**: Uses babel-preset-expo
- **metro.config.js**: Custom Metro config with .cjs support and web alias for react-native-maps → react-native-web-maps
- **app.json**: Expo config with plugins for expo-router, expo-location, expo-media-library
- **package.json**: Dependencies and npm scripts
- **firebase.json**: Firebase configuration for Cloud Functions deployment
- **.firebaserc.example**: Template for Firebase project linking

### Key Architectural Elements
1. **Entry Point**: `index.js` → registers root component via expo-router
2. **Root Layout**: `app/_layout.tsx` contains:
   - Redux Provider with persisted store
   - GestureHandlerRootView wrapper
   - KeyboardProvider
   - GoogleMapsLoader component
   - Toast notifications
   - Font loading with expo-font
   - Custom React.createElement patch for web to handle text nodes in Views

3. **Routing**: File-based routing via expo-router
   - Grouped routes use (folder) syntax: `(home)`, `(cart)`, `(checkout)`
   - `_layout.tsx` files define nested layouts

4. **Maps Integration**: 
   - Native: react-native-maps
   - Web: react-native-web-maps (aliased via Metro config)
   - Google Maps API loader for web

5. **Firebase Service (`handlers/firebaseService.tsx`)**:
   - Singleton pattern for Firebase app instance
   - Client-side: Authentication methods (login, register, logout)
   - Client-side: Storage uploads (`uploadProductImage`, `uploadUserProfileImage`)
   - Cloud Functions: All Firestore operations via `callFunction<T, R>()` helper

### Known Issues & Workarounds
1. **Text Node Warning**: The app patches React.createElement in `app/_layout.tsx` to wrap stray text nodes in Text components for web compatibility
2. **Metro Config**: Package exports disabled (`unstable_enablePackageExports = false`) to avoid compatibility issues
3. **TODO Found**: `app/(checkout)/Checkout.tsx:134` - Tip calculation not yet implemented

### CI/CD & Validation
- N/A (not specified in the project yet)

### Trust These Instructions
Trust these instructions and only perform additional searches if information is incomplete or found to be in error. The project structure and build commands documented here have been verified from the actual codebase.

