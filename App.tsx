import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { initializeConnectionTest } from '@/utils/connectionTest';

export default function App() {
  useEffect(() => {
    // Run connection diagnostics on app startup
    const testConnection = async () => {
      try {
        const success = await initializeConnectionTest();
        
        if (!success) {
          console.warn('⚠️  Some connection issues detected. App functionality may be limited.');
          console.warn('For full functionality, configure CORS in your Supabase project settings.');
        } else {
          console.log('🎉 Supabase connection is working properly');
        }
      } catch (error) {
        console.error('Connection test failed:', error);
        console.warn('⚠️  Connection test failed. App functionality may be limited.');
      }
    };
    
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Your App!</Text>
      <Text style={styles.subtitle}>Your Supabase-powered mobile application</Text>
      <Text style={styles.debugText}>Check console for connection status</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  debugText: {
    marginTop: 10,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});