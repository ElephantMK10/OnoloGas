import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import CustomTextInput from '../../components/CustomTextInput';
import Button from '../../components/Button';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const router = useRouter();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
  const { register, isLoading, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Real-time email validation
  const validateEmail = (email: string | null) => {
    if (!email) {
      setEmailError(null);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(null);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    validateEmail(text);
  };

  const handleRegister = async () => {
    if (isLoading) return; // Prevent double submit

    // Clear any previous errors
    setRegistrationError(null);

    // Normalize inputs
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Validate inputs
    if (!trimmedName || !normalizedEmail || !password || !confirmPassword) {
      setRegistrationError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setRegistrationError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setRegistrationError('Password must be at least 6 characters long');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setRegistrationError('Please enter a valid email address');
      return;
    }

    try {
      console.log('Registration attempt for:', normalizedEmail);
      const success = await register(trimmedName, normalizedEmail, password);
      
      if (success) {
        // Show success toast - navigation is handled by AuthGuard
        Toast.show({
          type: 'success',
          text1: 'Welcome!',
          text2: 'Your account has been created.',
        });
        
        // If we have a redirectTo, handle it here since we're already on the auth flow
        if (redirectTo) {
          router.replace(redirectTo as any);
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setRegistrationError(error?.message || 'Registration failed. Please try again.');
    }
  };

  // Redirect if user is already logged in
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      if (redirectTo) {
        router.replace(redirectTo as any);
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  const handleLogin = () => {
    if (redirectTo) {
      router.push({
        pathname: '/auth/login',
        params: { redirectTo: redirectTo as string }
      } as any);
    } else {
      router.push('/auth/login');
    }
  };

  const handleBack = () => {
    // Go back to the main site (landing page) instead of login
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.white} />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/onolo-logo-new.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>Onolo Gas</Text>
            </View>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started with Onolo Gas.</Text>

            <View style={styles.form}>
              <CustomTextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                leftIcon="person-outline"
                returnKeyType="next"
                autoCapitalize="words"
                textContentType="name"
                editable={!isLoading}
              />

              <CustomTextInput
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                leftIcon="mail-outline"
                returnKeyType="next"
                error={emailError}
                editable={!isLoading}
              />

              <CustomTextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry={!showPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                returnKeyType="next"
                autoCapitalize="none"
                textContentType="newPassword"
                editable={!isLoading}
              />

              <CustomTextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                autoCapitalize="none"
                textContentType="newPassword"
                editable={!isLoading}
              />

              {/* Registration Error Banner */}
              {registrationError && (
                <View style={styles.registrationErrorBanner}>
                  <Ionicons name="alert-circle-outline" size={20} color="#FF6B6B" />
                  <Text style={styles.registrationErrorText}>{registrationError}</Text>
                  <TouchableOpacity onPress={() => setRegistrationError(null)}>
                    <Ionicons name="close" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              )}





              <Button
                title="Register"
                onPress={handleRegister}
                loading={isLoading}
                style={styles.registerButton}
                disabled={isLoading || !!emailError}
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
                  <Text style={[styles.loginLink, isLoading && styles.disabledLink]}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
      </KeyboardAvoidingView>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  appName: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.text.gray,
    fontSize: 16,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  registerButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginText: {
    color: COLORS.text.gray,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledLink: {
    color: COLORS.text.gray,
    opacity: 0.5,
  },

  registrationErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B20', // Light red background
    borderColor: '#FF6B6B40',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  registrationErrorText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
});