import React, { useRef, ComponentProps } from 'react';
import {
  TextInput,
  StyleSheet,
  TextInputProps,
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
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

// Type for our custom styles
interface CustomTextInputStyles {
  container: ViewStyle;
  label: TextStyle;
  inputContainer: ViewStyle;
  input: TextStyle; // Changed to TextStyle to fix type issues
  inputWithLeftIcon: ViewStyle;
  inputWithRightIcon: ViewStyle;
  leftIconContainer: ViewStyle;
  rightIconContainer: ViewStyle;
  textArea: ViewStyle;
  inputError: ViewStyle;
  errorText: TextStyle;
}

type CustomIconProps = ComponentProps<typeof CustomIcon>;

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  error?: string | null;
  isTextArea?: boolean;
  leftIcon?: CustomIconProps['name'];
  rightIcon?: CustomIconProps['name'];
  onRightIconPress?: (event: GestureResponderEvent) => void;
}

// Type for web-specific styles that aren't in the default React Native types
type WebViewStyle = {
  cursor?: 'text' | 'pointer';
  userSelect?: 'text' | 'none' | 'auto' | 'contain' | 'all';
  outlineStyle?: 'none';
};

// Type guard to check if the style is a web style
const isWebViewStyle = (style: any): style is WebViewStyle => {
  return style && (style.cursor || style.userSelect || style.outlineStyle);
};

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

  // Create base style array
  const inputContainerStyle = [
    styles.inputContainer,
    // @ts-ignore - Web-specific styles
    Platform.OS === 'web' && {
      cursor: 'text',
      userSelect: 'none',
    }
  ] as StyleProp<ViewStyle>;
  
  const inputStyle = [
    styles.input,
    isTextArea && styles.textArea,
    error && styles.inputError,
    leftIcon && styles.inputWithLeftIcon,
    rightIcon && styles.inputWithRightIcon,
    // @ts-ignore - Web-specific styles
    Platform.OS === 'web' && {
      outlineStyle: 'none',
      cursor: 'text',
    },
    style,
  ] as StyleProp<TextStyle>;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={inputContainerStyle}
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
          style={inputStyle}
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

// Create styles with type assertions
const styles = StyleSheet.create<CustomTextInputStyles>({
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
    // Web-specific styles will be added inline
  },
  // @ts-ignore - Using any to bypass complex type issues
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 12,
    color: COLORS.text.white,
    fontSize: 16,
    borderWidth: 0,
    // Web styles will be added inline
  } as any,
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
    // @ts-ignore - textAlignVertical is not in the type but is valid
    textAlignVertical: 'top',
    paddingTop: 12,
  } as unknown as ViewStyle,
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});
