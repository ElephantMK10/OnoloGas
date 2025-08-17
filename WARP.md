# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React Native/Expo application for LPG gas delivery and communication, powered by Supabase. The app includes real-time chat, order management, payment processing (PayFast), and AI assistant features.

## Essential Commands

### Development

```bash
# Start development server (Expo)
npm run dev
# or
yarn dev

# Run on specific platforms
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser

# Clean install (when dependencies fail)
npm run clean:install

# Clear Metro cache (when bundler issues occur)
npm run cache:clear

# Build for web deployment
npm run build
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code with Prettier
npm run format

# Run tests
npm run test

# Run a specific test file
npm test -- __tests__/utils/profileValidation.test.ts
```

### iOS Build & Deployment

```bash
# Build iOS for production (EAS)
npm run build:ios

# Fast iOS export (development)
npm run build:ios:fast

# Prebuild with clean cache
npm run prebuild:clean

# Optimize images
npm run optimize:images

# Analyze bundle size
npm run analyze:bundle
```

### Supabase Local Development

```bash
# Start Supabase locally
npx supabase start

# Stop Supabase
npx supabase stop

# Reset database with migrations and seeds
npx supabase db reset

# Push migrations to remote
npx supabase db push

# Generate TypeScript types from database
npx supabase gen types typescript --local > types/database.types.ts
```

## Architecture & Key Components

### Application Structure

The app follows a feature-based architecture with these key directories:

- **`app/`**: Expo Router file-based routing
  - `(tabs)/`: Bottom tab navigation screens (home, menu, cart, chat, order)
  - `auth/`: Authentication screens (login, register)
  - `_layout.tsx`: Root layout with authentication state management
  
- **`lib/supabase.ts`**: Core Supabase client configuration
  - Handles environment variable loading from EAS secrets or local .env
  - Implements retry logic and CORS error handling
  - Provides enhanced error messages for development

- **`context/CartContext.tsx`**: Global cart state management
  - Manages cart items, quantities, and calculations
  - Persists cart state across navigation

- **`utils/`**: Critical utilities
  - `payfast.ts` & `payfast-dev.ts`: Payment processing with development simulation
  - `notifications.ts`: Push notification handling
  - `queryClient.ts`: React Query configuration with retry logic
  - `global-error-handler.ts`: Centralized error handling

### Authentication Flow

The app uses Supabase Auth with these key components:
1. **`app/_layout.tsx`**: Monitors auth state and redirects based on session
2. **`lib/supabase.ts`**: Handles auth operations with retry logic
3. **Session persistence**: Uses AsyncStorage for token storage
4. **Deep linking**: Configured for `onolo://` scheme

### Payment Integration (PayFast)

The app implements PayFast payment gateway with special handling for development:
- **Production**: Direct integration with PayFast API
- **Development**: Simulated flow due to PayFast URL validation requirements
- **Return URLs**: Configured for `orders-onologroup.online` domain

### Real-time Features

- **Chat**: WebSocket-based real-time messaging via Supabase Realtime
- **Notifications**: Expo Push Notifications with optimization for performance
- **Order updates**: Real-time order status updates

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_MAPBOX_TOKEN=your_mapbox_token  # Optional
```

### EAS Build Secrets

For production builds via EAS, configure these secrets:

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "your_url"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_key"
eas secret:create --name EXPO_PUBLIC_MAPBOX_TOKEN --value "your_token"
```

### iOS CI/CD Secrets (GitHub Actions)

Required for automated iOS builds:
- `APPLE_ID`: Apple Developer account email
- `APPLE_TEAM_ID`: Apple Developer Team ID
- `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_CONTENT`: App Store Connect API key
- `MATCH_GIT_URL`, `MATCH_PASSWORD`: Fastlane Match configuration

## Common Development Scenarios

### CORS Issues on Web

If you encounter "Failed to fetch" errors on web:
1. Go to Supabase Dashboard → Settings → API → Configuration
2. Add these URLs to "Web origins (CORS)":
   - Development: `http://localhost:8081`, `http://localhost:19006`, `http://localhost:3000`
   - Production: `https://orders-onologroup.online`, `https://orders-onologroup.netlify.app`

### Metro Bundler Issues

```bash
# Clear all caches
npm run cache:clear
rm -rf .expo
npx expo start --clear
```

### iOS Build Failures

1. Check Xcode version (requires 16.1)
2. Verify CocoaPods: `cd ios && pod install --repo-update`
3. Check certificates: Fastlane Match handles this automatically in CI

### Database Migrations

```bash
# Create new migration
npx supabase migration new migration_name

# Apply locally
npx supabase db reset

# Push to production
npx supabase db push --linked
```

## Testing Strategy

- **Unit tests**: Located in `__tests__/` for utilities and validation
- **Component tests**: Use React Native Testing Library
- **E2E tests**: Not yet implemented, consider Detox for future

Run specific test suites:
```bash
npm test -- --testPathPattern=profileValidation
npm test -- --coverage
```

## Performance Optimizations

The codebase includes several performance optimizations:

1. **Image preloading**: `utils/imagePreloader.ts` loads images on app start
2. **Notification batching**: Groups notifications to reduce re-renders
3. **Query caching**: React Query with stale-while-revalidate strategy
4. **Metro bundling**: Optimized configuration with caching and parallel processing
5. **Bundle splitting**: Web build uses single output for optimal loading

## Deployment

### Web (Netlify)

Configured via `netlify.toml`:
```bash
npm run build
# Deploys automatically on push to main branch
```

### iOS (TestFlight)

GitHub Actions workflow automatically:
1. Builds on push to main branch
2. Signs with Fastlane Match
3. Uploads to TestFlight

### Android

```bash
eas build --platform android --profile production
```

## Key Integration Points

### Supabase Services
- **Database**: PostgreSQL with Row Level Security
- **Auth**: Email/password with session management
- **Storage**: File uploads for user avatars
- **Realtime**: WebSocket subscriptions for chat

### External Services
- **PayFast**: Payment processing (requires production URLs)
- **Chatbase**: AI assistant integration
- **Expo Push**: Notification delivery
- **Mapbox**: Location services (optional)

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| "CORS configuration required" | Add dev URL to Supabase CORS settings |
| "Metro cache error" | Run `npm run cache:clear` |
| "iOS build failing" | Check Xcode version, run `pod install` |
| "PayFast not working locally" | Use development simulation mode |
| "Supabase connection failed" | Verify environment variables are set |
| "Bundle too large" | Run `npm run analyze:bundle` to identify issues |
