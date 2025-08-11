import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/colors';

interface LogoutTransitionProps {
  children: React.ReactNode;
  isLoggingOut: boolean;
}

/**
 * Component to provide smooth transition during logout to prevent white flashes
 * Uses overlay approach instead of opacity to maintain dark background
 */
export default function LogoutTransition({
  children,
  isLoggingOut
}: LogoutTransitionProps) {
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoggingOut) {
      // Show dark overlay when logging out
      Animated.timing(overlayAnim, {
        toValue: 0.7, // Dark overlay opacity
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Hide overlay when not logging out
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoggingOut, overlayAnim]);

  return (
    <View style={styles.container}>
      {children}
      {/* Dark overlay that appears during logout */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayAnim,
          }
        ]}
        pointerEvents={isLoggingOut ? 'auto' : 'none'}
      >
        {isLoggingOut && (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Signing out...</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: COLORS.text.white,
    fontSize: 16,
    fontWeight: '500',
  },
});
