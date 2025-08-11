import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface SmoothTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  duration?: number;
}

export default function SmoothTransition({ 
  children, 
  isVisible, 
  duration = 200 
}: SmoothTransitionProps) {
  const fadeAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [isVisible, duration, fadeAnim]);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
