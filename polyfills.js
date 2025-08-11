import { Platform } from 'react-native';
// import structuredClone from '@ungap/structured-clone';

if (Platform.OS !== 'web') {
  // Remove all code related to @stardazed/streams-text-encoding
  // Polyfills for TextEncoderStream/TextDecoderStream are not needed for most Expo/React Native apps
}

export {};
