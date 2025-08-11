# kikionolo

A modern React Native/Expo app for LPG gas delivery and communication, powered by Supabase.

## Features

- Real-time chat with staff
- AI assistant (Chatbase)
- Order management and checkout
- Profile and settings
- Secure authentication
- Responsive UI for mobile and web

## Getting Started

### Prerequisites

- Node.js (18+ recommended)
- Yarn or npm
- Expo CLI (`npm install -g expo-cli`)

### Setup

1. Clone the repo:
   ```sh
   git clone <repo-url>
   cd project-kiki-onolo-v1
   ```
2. Install dependencies:
   ```sh
   yarn install
   # or
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your Supabase credentials.

### Running the App

- Start the Expo dev server:
  ```sh
  yarn dev
  # or
  npm run dev
  ```
- Open on your device with Expo Go, or run on iOS/Android simulators:
  ```sh
  yarn ios
  yarn android
  yarn web
  ```

### Linting & Formatting

- Lint code:
  ```sh
  yarn lint
  ```
- Format code:
  ```sh
  yarn format
  ```

### Testing

- (Coming soon) Run tests:
  ```sh
  yarn test
  ```

### Deployment

- Build for production with Expo EAS or classic build:
  ```sh
  expo build:android
  expo build:ios
  # or use EAS Build
  eas build --platform all
  ```

## Environment Variables

See `types/env.d.ts` for required variables:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Folder Structure

- `app/` - App screens and navigation
- `components/` - Reusable UI components
- `constants/` - Static config (colors, company info)
- `context/` - React context providers
- `lib/` - Supabase and other libraries
- `utils/` - Utility functions
- `types/` - TypeScript types
- `supabase/` - Database migrations

## Contributing

Pull requests welcome! Please lint and format your code before submitting.

## License

MIT

## PayFast Integration Notes

### Development Testing

PayFast requires publicly accessible URLs for return/cancel/notify URLs. During development with Expo Go, this creates challenges because:

1. `Linking.createURL()` creates `exp://` URLs that PayFast doesn't recognize
2. PayFast validates URL formats and requires HTTP/HTTPS URLs

### Solutions for Development:

1. **Use Development Simulation** (Current Implementation):
   - Simulates PayFast flow without external URLs
   - Shows development warnings
   - Allows testing the UI flow

2. **Use ngrok for Testing**:
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Create tunnel to your local server
   ngrok http 3000
   
   # Use the ngrok URL in PayFast configuration
   ```

3. **Use a Staging Server**:
   - Deploy a simple redirect service
   - Configure PayFast URLs to point to staging
   - Staging server redirects back to app using deep links

4. **Testing Services**:
   - Use webhook.site for temporary URLs
   - Use httpbin.org for testing endpoints

### Production Setup:

1. Configure proper domain in `app.json`:
   ```json
   {
     "expo": {
       "scheme": "onolo",
       "web": {
         "bundler": "metro"
       }
     }
   }
   ```

2. Set up proper return URLs:
   ```typescript
   return_url: 'https://orders-onologroup.online/payfast-success'
   cancel_url: 'https://orders-onologroup.online/payfast-cancel'
   notify_url: 'https://orders-onologroup.online/api/payfast-notify'
   ```

3. Implement deep linking to redirect back to app from web URLs.
