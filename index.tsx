// -------------- DO NOT put anything before this --------------
import './polyfills';

// (the rest can stay in whatever order you like)
import '@expo/metro-runtime';
import './utils/global-error-handler';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);