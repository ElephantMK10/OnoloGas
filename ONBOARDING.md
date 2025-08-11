# Onboarding Guide

Welcome to the kikionolo project! This guide will help you get set up and productive quickly.

## 1. Prerequisites

- Node.js 18+
- Yarn or npm
- Expo CLI (`npm install -g expo-cli`)
- Access to Supabase project credentials

## 2. Setup

1. Clone the repository and install dependencies:
   ```sh
   git clone <repo-url>
   cd project-kiki-onolo-v1
   yarn install
   # or npm install
   ```
2. Copy `.env.example` to `.env` and fill in the required environment variables (see `types/env.d.ts`).
3. Start the development server:
   ```sh
   yarn dev
   # or npm run dev
   ```
4. Open the app in Expo Go or a simulator.

## 3. Development Tips

- Use `yarn lint` and `yarn format` before committing.
- Most business logic is in `app/`, `components/`, and `utils/`.
- Supabase integration is in `lib/supabase.ts`.
- For chat features, see `app/(tabs)/chat.native.tsx`.

## 4. Testing

- (Coming soon) Run tests with `yarn test`.

## 5. Common Issues

- **Supabase errors:** Check your `.env` and Supabase project permissions.
- **Hermes/UUID errors:** Ensure `react-native-get-random-values` is imported in `App.tsx`.
- **Metro bundler issues:** Try `yarn start --clear`.

## 6. Useful Scripts

- `yarn dev` - Start dev server
- `yarn lint` - Lint code
- `yarn format` - Format code

## 7. Need Help?

- Ask in the project Slack/Discord or contact the maintainer.
