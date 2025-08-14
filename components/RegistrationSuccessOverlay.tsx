import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import CustomIcon from './CustomIcon';
import { COLORS } from '../constants/colors';
import { useRouter } from 'expo-router';

interface RegistrationSuccessOverlayProps {
  visible: boolean;
  userEmail: string;
  onComplete: () => void;
}

export default function RegistrationSuccessOverlay({
  visible,
  userEmail,
  onComplete
}: RegistrationSuccessOverlayProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  const steps = [
    { icon: 'checkmark-circle', text: 'Registration Successful!', duration: 2000 },
    { icon: 'mail', text: 'Setting up your account...', duration: 3000 },
    { icon: 'home', text: 'Taking you to your dashboard...', duration: 2000 }
  ];

  useEffect(() => {
    if (visible) {
      // Start the overlay animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Start the step progression
      progressThroughSteps();
    }
  }, [visible]);

  const progressThroughSteps = async () => {
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      
      // Animate progress bar
      Animated.timing(progress, {
        toValue: (i + 1) / steps.length,
        duration: steps[i].duration,
        useNativeDriver: false,
      }).start();

      // Wait for step duration
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
    }

    // Navigate to home after all steps
    router.replace('/home');
    
    // Complete the overlay
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  if (!visible) return null;

  const { width, height } = Dimensions.get('window');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            width,
            height,
          }
        ]}
      >
        <View style={styles.container}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <CustomIcon 
              name={steps[currentStep]?.icon as any} 
              size={80} 
              color={COLORS.primary} 
            />
          </View>

          {/* Main Message */}
          <Text style={styles.title}>Welcome to Onolo Gas!</Text>
          <Text style={styles.subtitle}>{userEmail}</Text>

          {/* Current Step */}
          <View style={styles.stepContainer}>
            <Text style={styles.stepText}>
              {steps[currentStep]?.text}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    width: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              Step {currentStep + 1} of {steps.length}
            </Text>
          </View>

          {/* Loading Indicator */}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>

          {/* Info Message */}
          <View style={styles.infoContainer}>
            <CustomIcon name="information-circle" size={20} color={COLORS.text.gray} />
            <Text style={styles.infoText}>
              Please wait while we set up your account and redirect you to the dashboard.
            </Text>
          </View>

          {/* Email Notice */}
          <View style={styles.emailNotice}>
            <CustomIcon name="mail-outline" size={16} color={COLORS.text.gray} />
            <Text style={styles.emailNoticeText}>
              Check your spam folder for any confirmation emails
            </Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 32,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  iconContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.gray,
    textAlign: 'center',
    marginBottom: 32,
  },
  stepContainer: {
    marginBottom: 24,
    minHeight: 24,
  },
  stepText: {
    fontSize: 18,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBackground: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.text.gray,
    textAlign: 'center',
  },
  loadingContainer: {
    marginBottom: 24,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.gray,
    marginLeft: 12,
    lineHeight: 20,
  },
  emailNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailNoticeText: {
    fontSize: 12,
    color: COLORS.text.gray,
    marginLeft: 6,
    textAlign: 'center',
  },
});
