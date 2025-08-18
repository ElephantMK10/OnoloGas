import React, { useState, useEffect } from 'react';
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
import { useRouter, usePathname, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import CustomTextInput from '../../components/CustomTextInput';
import Button from '../../components/Button';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
  const { login, isLoading, user } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !isLoading) {
      console.log('User already signed in, redirecting...');
      if (redirectTo) {
        router.replace(redirectTo as any);
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, router, redirectTo]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);



  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Real-time email validation
  useEffect(() => {
    if (email.length > 0 && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(null);
    }
  }, [email]);



  // Clear login error when inputs change (but not when loginError itself changes)
  useEffect(() => {
    if (loginError) {
      setLoginError(null);
    }
  }, [email, password]); // Removed loginError from dependencies to prevent infinite loop

  // Monitor pathname and force back to login if navigated away during authentication
  useEffect(() => {
    if (isAuthenticating && pathname !== '/auth/login') {
      console.log('🚨 Navigation detected during authentication, forcing back to login');
      router.replace('/auth/login');
    }
  }, [pathname, isAuthenticating, router]);



  const handleLogin = async () => {
    // Validate email format before attempting login
    if (!email || !password) {
      setLoginError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Clear any previous errors
    setLoginError(null);
    setIsAuthenticating(true);

    try {
      console.log('Login attempt for:', email);

      // Sign in with email and password using the auth service
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error || !data.user) {
        console.error('Login failed:', error?.message);

        // Show professional error message and stay on page
        if (error?.message?.includes('Invalid login credentials')) {
          setLoginError('Email Address or Password is incorrect');
        } else if (error?.message?.includes('Email not confirmed')) {
          setLoginError('Please check your email and confirm your account');
        } else if (error?.message?.includes('Too many requests')) {
          setLoginError('Too many login attempts. Please try again later');
        } else {
          setLoginError('Email Address or Password is incorrect');
        }
        return;
      }

      console.log('Login successful, saving remember-me preference and navigating...');
      try {
        await AsyncStorage.setItem('onolo_remember_me', keepSignedIn ? '1' : '0');
      } catch (e) {
        console.warn('Failed to persist remember-me preference', e);
      }
      // If successful, navigate to the intended destination or home
      if (redirectTo) {
        router.replace(redirectTo as any);
      } else {
        router.replace('/(tabs)');
      }

    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError('Email Address or Password is incorrect');
    } finally {
      setIsAuthenticating(false);
    }
  };


  const handleRegister = () => {
    router.push('/auth/register');
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
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../assets/images/onolo-logo-new.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.appName}>Onolo Gas</Text>
            </View>

            <Text style={styles.title}>Enter your sign-in details</Text>
            <Text style={styles.subtitle}>We'll only send you important updates, the latest deals and can't-miss offers, never spam.</Text>







            <View style={styles.form}>
              <CustomTextInput
                label="Email Address:"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
                returnKeyType="next"
                style={emailError ? styles.inputError : undefined}
              />

              {/* Email validation error */}
              {emailError && (
                <Text style={styles.emailErrorText}>{emailError}</Text>
              )}

              <CustomTextInput
                label="Password:"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                returnKeyType="done"
              />



              {/* Professional Login Error Banner - Right after password field */}
              {loginError && (
                <View style={styles.loginErrorBanner}>
                  <Ionicons name="alert-circle-outline" size={20} color="#FF6B6B" />
                  <Text style={styles.loginErrorText}>{loginError}</Text>
                  <TouchableOpacity onPress={() => setLoginError(null)}>
                    <Ionicons name="close" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
              </TouchableOpacity>

              {/* Keep me signed in checkbox */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[styles.checkbox, keepSignedIn && styles.checkboxChecked]}
                  onPress={() => setKeepSignedIn(!keepSignedIn)}
                >
                  {keepSignedIn && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>
                <Text style={styles.checkboxText}>Keep me signed in</Text>
                <Text style={styles.checkboxSubtext}>You might need to sign in again for future updates.</Text>
              </View>

              <Button
                title="SIGN-IN"
                onPress={handleLogin}
                loading={isLoading}
                style={styles.loginButton}
              />


              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={handleRegister}>
                  <Text style={styles.registerLink}>Register</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.termsButton}>
                <Text style={styles.termsText}>TERMS & CONDITIONS</Text>
              </TouchableOpacity>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 0,
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
  loginButton: {
    marginTop: 16,
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.text.gray,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  guestButton: {
    marginBottom: 24,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  registerText: {
    color: COLORS.text.gray,
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    color: COLORS.text.white,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  // Email validation error
  emailErrorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  // Professional login error banner (similar to your example)
  loginErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: '#FF6B6B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  loginErrorText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  // Keep me signed in checkbox
  checkboxContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    backgroundColor: '#333333',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkboxText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  checkboxSubtext: {
    color: COLORS.text.gray,
    fontSize: 14,
    lineHeight: 18,
  },
  // Terms & Conditions button
  termsButton: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  termsText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});