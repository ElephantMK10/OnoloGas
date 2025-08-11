import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

// Use env variable if available, otherwise fallback to the provided public token
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoia2tubWFsMDAzIiwiYSI6ImNtOWI2NGF1MjBjdWwya3M1Mmxua3hqaXgifQ._PMbFD1tTIq4zmjGCwnAHg';

// Helper function to convert React Native styles to web-compatible styles
const convertStyleToWeb = (style: any) => {
  if (!style) return {};

  // If it's an array of styles, merge them
  if (Array.isArray(style)) {
    return style.reduce((acc, s) => ({ ...acc, ...convertStyleToWeb(s) }), {});
  }

  // Convert React Native style properties to web-compatible ones
  const webStyle: any = {};

  Object.keys(style).forEach(key => {
    const value = style[key];

    // Skip React Native-specific properties that don't work on web
    if (['shadowColor', 'shadowOffset', 'shadowOpacity', 'shadowRadius', 'elevation'].includes(key)) {
      return;
    }

    // Convert specific React Native properties to web equivalents
    switch (key) {
      case 'paddingHorizontal':
        webStyle.paddingLeft = value;
        webStyle.paddingRight = value;
        break;
      case 'paddingVertical':
        webStyle.paddingTop = value;
        webStyle.paddingBottom = value;
        break;
      case 'marginHorizontal':
        webStyle.marginLeft = value;
        webStyle.marginRight = value;
        break;
      case 'marginVertical':
        webStyle.marginTop = value;
        webStyle.marginBottom = value;
        break;
      default:
        webStyle[key] = value;
    }
  });

  return webStyle;
};

// Web-optimized input component that uses native HTML input on web
const WebOptimizedInput = Platform.OS === 'web'
  ? React.forwardRef<any, any>(({
      onFocus,
      onBlur,
      style,
      value,
      onChangeText,
      placeholder,
      placeholderTextColor,
      // Filter out React Native-specific props that don't work on web
      returnKeyType,
      blurOnSubmit,
      enablesReturnKeyAutomatically,
      autoCorrect,
      autoCapitalize,
      textContentType,
      autoComplete,
      showSoftInputOnFocus,
      keyboardType,
      ...webProps
    }, ref) => {
      const webStyle = convertStyleToWeb(style);

      return (
        <input
          ref={ref}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: COLORS.text.white,
            fontSize: 16,
            flex: 1,
            padding: 0,
            margin: 0,
            width: '100%',
            height: '100%',
            fontFamily: 'inherit',
            ...webStyle,
          }}
          onFocus={(e) => {
            console.log('Web input focused');
            onFocus?.(e);
          }}
          onBlur={(e) => {
            console.log('Web input blur triggered');
            // Delay blur to allow for suggestion clicks
            setTimeout(() => {
              console.log('Web input blur executed');
              onBlur?.(e);
            }, 200);
          }}
          onChange={(e) => {
            onChangeText?.(e.target.value);
          }}
        />
      );
    })
  : TextInput;

interface AddressAutocompleteProps {
  label?: string;
  value: string;
  onAddressSelect: (address: string | any) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

export default function AddressAutocomplete({
  label,
  value,
  onAddressSelect,
  placeholder = 'Enter your address...',
  style,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<any>(null); // Use any for cross-platform compatibility
  const suggestionsContainerRef = useRef<View>(null);
  const containerRef = useRef<View>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=ZA&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (e) {
        setSuggestions([]);
      }
    };
    const timeout = setTimeout(fetchSuggestions, 300); // debounce
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (feature: any) => {
    console.log('handleSelect called with:', feature.place_name || feature);
    const selectedAddress = feature.place_name || feature;
    setQuery(selectedAddress);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsInteractingWithSuggestions(false);
    onAddressSelect(selectedAddress);

    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // On web, keep focus on input for better UX
    if (Platform.OS === 'web') {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } else {
      // On mobile, blur input and dismiss keyboard
      if (inputRef.current) {
        inputRef.current.blur();
      }
      Keyboard.dismiss();
    }
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    setShowSuggestions(text.length >= 3);
    onAddressSelect(text); // keep parent in sync
  };

  // Track if user is interacting with suggestions to prevent premature closing
  const [isInteractingWithSuggestions, setIsInteractingWithSuggestions] = useState(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Only hide suggestions if focus is lost from both input and dropdown
  const handleBlur = () => {
    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // Don't close if user is interacting with suggestions
    if (isInteractingWithSuggestions) {
      return;
    }

    // Different timeout for web vs mobile
    const timeout = Platform.OS === 'web' ? 300 : 300;
    blurTimeoutRef.current = setTimeout(() => {
      if (!isInteractingWithSuggestions) {
        setShowSuggestions(false);
      }
    }, timeout);
  };

  // Web-specific blur handler optimized for native HTML input
  const handleWebBlur = (e: any) => {
    console.log('Web blur triggered, isInteractingWithSuggestions:', isInteractingWithSuggestions);

    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // Don't close if user is interacting with suggestions
    if (isInteractingWithSuggestions) {
      console.log('User is interacting with suggestions, keeping open');
      return;
    }

    // Use a longer delay for web to allow mouse interactions
    blurTimeoutRef.current = setTimeout(() => {
      console.log('Web blur timeout executed, isInteractingWithSuggestions:', isInteractingWithSuggestions);
      if (!isInteractingWithSuggestions) {
        setShowSuggestions(false);
      }
    }, 300);
  };

  // Click outside handler for web
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleClickOutside = (event: any) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        console.log('Click outside detected');
        setShowSuggestions(false);
        setIsInteractingWithSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSuggestions]);

  // Prevent dropdown from closing when interacting with suggestions
  const handleSuggestionsMouseEnter = () => {
    if (Platform.OS === 'web') {
      setIsInteractingWithSuggestions(true);
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    }
  };

  const handleSuggestionsMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsInteractingWithSuggestions(false);
    }
  };

  // Prevent dropdown from closing when tapping/scrolling inside
  const handleSuggestionsPressIn = () => {
    setIsInteractingWithSuggestions(true);
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
  };

  const handleSuggestionsPressOut = () => {
    // Small delay to allow onPress to fire first
    setTimeout(() => {
      setIsInteractingWithSuggestions(false);
    }, 100);
  };

  const clearInput = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setIsInteractingWithSuggestions(false);
    onAddressSelect('');
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    inputRef.current?.focus();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, style]} ref={containerRef}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <Ionicons
          name="location-outline"
          size={20}
          color={COLORS.text.gray}
          style={styles.inputIcon}
        />
        <WebOptimizedInput
          ref={inputRef}
          style={[styles.input, Platform.OS === 'web' && styles.webInput]}
          value={query}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.gray}
          returnKeyType="done"
          onBlur={Platform.OS === 'web' ? handleWebBlur : handleBlur}
          onFocus={() => {
            console.log('Input focused, query length:', query.length);
            setIsInteractingWithSuggestions(false);
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
            }
            setShowSuggestions(query.length >= 3);
          }}
          blurOnSubmit={true}
          enablesReturnKeyAutomatically={true}
          autoCorrect={false}
          autoCapitalize="words"
          textContentType="fullStreetAddress"
          autoComplete={Platform.OS === 'web' ? 'address-line1' : 'street-address'}
          showSoftInputOnFocus={true}
          keyboardType="default"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearInput} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={COLORS.text.gray} />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View
          style={styles.suggestionsContainer}
          ref={suggestionsContainerRef}
          {...(Platform.OS === 'web' && {
            onMouseEnter: () => {
              console.log('Mouse entered suggestions');
              setIsInteractingWithSuggestions(true);
            },
            onMouseLeave: () => {
              console.log('Mouse left suggestions');
              setIsInteractingWithSuggestions(false);
              // Give a small delay before potentially closing
              setTimeout(() => {
                if (!isInteractingWithSuggestions) {
                  setShowSuggestions(false);
                }
              }, 100);
            },
          })}
        >
            <ScrollView
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled={true}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => {
                    console.log('Suggestion clicked:', item.place_name);
                    handleSelect(item);
                  }}
                  {...(Platform.OS === 'web' && {
                    onMouseEnter: () => {
                      console.log('Mouse entered suggestion item');
                      setIsInteractingWithSuggestions(true);
                    },
                    onMouseDown: (e) => {
                      e.preventDefault();
                      console.log('Suggestion mouse down:', item.place_name);
                      // Immediately set interaction state to prevent blur from closing
                      setIsInteractingWithSuggestions(true);
                    },
                    onClick: () => {
                      console.log('Suggestion clicked (web):', item.place_name);
                      handleSelect(item);
                    },
                  })}
                >
                  <Ionicons
                    name="location"
                    size={16}
                    color={COLORS.primary}
                    style={styles.suggestionIcon}
                  />
                  <Text style={styles.suggestionText}>{item.place_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
    position: 'relative',
  },
  label: {
    color: COLORS.text.lightGray,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 48,
    // Web-specific improvements
    ...(Platform.OS === 'web' && {
      cursor: 'text',
      // Ensure the container doesn't interfere with input focus
      position: 'relative',
    }),
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: COLORS.text.white,
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 8,
  },
  webInput: {
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      cursor: 'text',
      // Ensure proper focus behavior on web
      borderWidth: 0,
      backgroundColor: 'transparent',
      // Force web input to be interactive and focusable
      pointerEvents: 'auto',
      userSelect: 'text',
      // Ensure input is properly accessible
      tabIndex: 0,
      // Prevent any interference with focus
      zIndex: 1,
    }),
  },
  clearButton: {
    padding: 8,
    marginRight: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 9999,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    // Web-specific improvements
    ...(Platform.OS === 'web' && {
      position: 'absolute',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    }),
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    color: COLORS.text.white,
    fontSize: 15,
    flex: 1,
  },
});
