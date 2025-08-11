import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';

// Root Landing/Welcome Page - Public marketing page
export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    // Navigate to main app (home) instead of forcing login
    router.replace('/home');
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.headline}>
        Fuel <Text style={styles.white}>On</Text>
        {'\n'}Demand
      </Text>
      <Text style={styles.subtitle}>Order LPG gas refills in seconds – we'll handle the rest</Text>

      {['Fast Delivery', 'Simple Ordering', 'Secure Payment'].map((item) => (
        <View key={item} style={styles.bullet}>
          <View style={styles.dot} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}

      {/* Primary CTA - Browse as guest */}
      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.8}
        onPress={handleGetStarted}
      >
        <Text style={styles.primaryButtonText}>Browse Products →</Text>
      </TouchableOpacity>

      {/* Secondary CTAs - Auth options */}
      <View style={styles.authContainer}>
        <Text style={styles.authPrompt}>Already have an account?</Text>
        <View style={styles.authButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={handleLogin}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={handleRegister}
          >
            <Text style={styles.secondaryButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 40,
    minHeight: '100%',
  },
  headline: {
    fontSize: 64,
    fontWeight: '900',
    color: COLORS.primary,
    lineHeight: 70,
  },
  white: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.text.gray,
    marginTop: 16,
    marginBottom: 40,
    lineHeight: 24,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  bulletText: {
    fontSize: 16,
    color: COLORS.text.white,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  primaryButtonText: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  authContainer: {
    alignItems: 'center',
  },
  authPrompt: {
    fontSize: 16,
    color: COLORS.text.gray,
    marginBottom: 16,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 100,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
