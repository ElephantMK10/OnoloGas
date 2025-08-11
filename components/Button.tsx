import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  Keyboard,
  Pressable,
} from 'react-native';
import { COLORS } from '../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  dismissKeyboard?: boolean; // New prop to control keyboard dismissal
}

export default function Button({
  title,
  onPress,
  style,
  textStyle,
  loading = false,
  disabled = false,
  variant = 'primary',
  dismissKeyboard = true, // Default to true for backward compatibility
}: ButtonProps) {
  const handlePress = () => {
    // Call the onPress handler first
    onPress();

    // Then dismiss keyboard if requested
    if (dismissKeyboard) {
      Keyboard.dismiss();
    }
  };

  const getButtonStyle = () => {
    if (variant === 'secondary') {
      return styles.secondaryButton;
    } else if (variant === 'outline') {
      return styles.outlineButton;
    }
    return styles.primaryButton;
  };

  const getTextStyle = () => {
    if (variant === 'secondary') {
      return styles.secondaryButtonText;
    } else if (variant === 'outline') {
      return styles.outlineButtonText;
    }
    return styles.primaryButtonText;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        getButtonStyle(),
        disabled && styles.disabledButton,
        pressed && styles.buttonPressed,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      android_ripple={{
        color: variant === 'outline' ? 'rgba(255, 107, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)',
      }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? COLORS.primary : COLORS.text.white}
          size="small"
        />
      ) : (
        <Text style={[styles.buttonText, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  disabledButton: {
    backgroundColor: COLORS.inactive,
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryButtonText: {
    color: COLORS.text.white,
  },
  secondaryButtonText: {
    color: COLORS.text.white,
  },
  outlineButtonText: {
    color: COLORS.primary,
  },
});
