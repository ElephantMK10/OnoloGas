import * as Linking from 'expo-linking';

export async function getInitialUrlSafe(timeoutMs = 1200) {
  try {
    return await Promise.race([
      Linking.getInitialURL(),
      new Promise(resolve => setTimeout(() => resolve(null), timeoutMs)),
    ]);
  } catch {
    return null;
  }
}
