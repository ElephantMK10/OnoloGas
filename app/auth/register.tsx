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
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth/AuthService';
import CustomTextInput from '../../components/CustomTextInput';
import Button from '../../components/Button';
import Toast from 'react-native-toast-message';
import RegistrationSuccessOverlay from '../../components/RegistrationSuccessOverlay';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Real-time email validation
  const validateEmail = (email: string) => {
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
    console.log('handleRegister called with:', { name, email, password: '***', confirmPassword: '***' });

    // Clear any previous errors
    setRegistrationError(null);

    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      console.log('Validation failed: missing fields');
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
    if (!emailRegex.test(email)) {
      setRegistrationError('Please enter a valid email address');
      return;
    }

    // Clear any previous errors
    setRegistrationError(null);
    setIsRegistering(true);

    try {
      console.log('Registration attempt for:', email);

      // Use AuthContext register function for proper state management
      const success = await register(name, email, password);
      console.log('Registration result:', success);

      if (success) {
        console.log('Registration successful for:', email);

        // Show success message immediately
        alert('Registration successful! Welcome to Onolo Gas.');

        // Navigate to home immediately
        console.log('Registration: Navigating to home');
        router.replace('/home');

        // Keep spinner visible for 10 seconds to prevent showing landing page flash
        setTimeout(() => {
          setIsRegistering(false);
        }, 10000);

        // Don't turn off spinner in finally block for successful registration
        return;

      } else {
        console.error('Registration failed');
        setRegistrationError('Registration failed. Please try again.');
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      setRegistrationError('An unexpected error occurred. Please try again.');
    } finally {
      // Only turn off spinner if registration failed
      if (!isRegistering) return;
      setIsRegistering(false);
    }
  };

  const handleLogin = () => {
    router.push('/auth/login');
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
              />

              <CustomTextInput
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
                returnKeyType="next"
                error={emailError}
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
                loading={isRegistering}
                style={styles.registerButton}
                disabled={isRegistering}
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={handleLogin} disabled={isRegistering}>
                  <Text style={[styles.loginLink, isRegistering && styles.disabledLink]}>Login</Text>
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