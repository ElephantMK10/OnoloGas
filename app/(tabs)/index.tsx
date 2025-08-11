import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Tabs index - redirect to main home route
export default function TabsIndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main home route
    router.replace('/home');
  }, [router]);

  return null; // This component just redirects
}


