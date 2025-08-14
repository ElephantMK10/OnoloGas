import React, { useRef, ComponentProps } from 'react';
import {
  TextInput,
  StyleSheet,
  TextInputProps,
  View,
  Text,
  StyleProp,
  ViewStyle,
  Keyboard,
  Platform,
  TouchableOpacity,
  GestureResponderEvent,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextInputSubmitEditingEventData,
} from 'react-native';
import { COLORS } from '../constants/colors';
import CustomIcon from './CustomIcon';

type CustomIconProps = ComponentProps<typeof CustomIcon>;

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  isTextArea?: boolean;
  leftIcon?: CustomIconProps['name'];
  rightIcon?: CustomIconProps['name'];
  onRightIconPress?: (event: GestureResponderEvent) => void;
}

export default function CustomTextInput({
  label,
  containerStyle,
  error,
  isTextArea = false,
  style,
  onSubmitEditing,
  returnKeyType = 'done',
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...rest
}: CustomTextInputProps) {
  const inputRef = useRef<TextInput>(null);

  // Enhanced keyboard dismissal
  const handleSubmitEditing = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    // Always dismiss keyboard when done is pressed or when editing finishes
    if (returnKeyType === 'done' || isTextArea) {
      Keyboard.dismiss();
    }

    // Call the original onSubmitEditing if provided
    if (onSubmitEditing) {
      onSubmitEditing(e);
    }
  };

  // Handle focus lost to ensure keyboard dismisses
  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    if (rest.onBlur) {
      rest.onBlur(e);
    }
  };

  // Handle container press to focus input (especially important for web)
  const handleContainerPress = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle focus to ensure proper behavior on web
  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    if (rest.onFocus) {
      rest.onFocus(e);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={handleContainerPress}
        activeOpacity={1}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <CustomIcon name={leftIcon} size={20} color={COLORS.text.gray} />
          </View>
        )}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            isTextArea && styles.textArea,
            error && styles.inputError,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={COLORS.text.gray}
          returnKeyType={returnKeyType}
          onSubmitEditing={handleSubmitEditing}
          onBlur={handleBlur}
          onFocus={handleFocus}
          blurOnSubmit={returnKeyType === 'done' || isTextArea}
          // Enhanced keyboard management
          enablesReturnKeyAutomatically={true}
          clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
          // Ensure keyboard shows on all platforms
          showSoftInputOnFocus={true}
          // iOS-specific fixes
          editable={true}
          pointerEvents="auto"
          importantForAccessibility="yes"
          // Web-specific improvements
          autoComplete={Platform.OS === 'web' ? 'off' : undefined}
          spellCheck={Platform.OS === 'web' ? false : undefined}
          // Ensure proper focus behavior on web
          selectTextOnFocus={Platform.OS === 'web'}
          // Force keyboard to show on mobile
          keyboardType={rest.keyboardType || 'default'}
          // Web-specific focus improvements
          {...(Platform.OS === 'web' && {
            autoFocus: false,
            tabIndex: 0,
          })}
          {...rest}
        />
        {rightIcon && (
          <TouchableOpacity style={styles.rightIconContainer} onPress={onRightIconPress}>
            <CustomIcon name={rightIcon} size={20} color={COLORS.text.gray} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: COLORS.text.lightGray,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 48,
    // Web-specific improvements for better interaction
    ...(Platform.OS === 'web' && {
      cursor: 'text',
      userSelect: 'none',
    }),
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 12,
    color: COLORS.text.white,
    fontSize: 16,
    borderWidth: 0,
    // Web-specific improvements
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      cursor: 'text',
    }),
  },
  inputWithLeftIcon: {
    paddingLeft: 40,
  },
  inputWithRightIcon: {
    paddingRight: 40,
  },
  leftIconContainer: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});
