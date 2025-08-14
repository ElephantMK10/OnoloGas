import React from 'react';
import { View, Text, StyleSheet, Button, Linking } from 'react-native';
import { COLORS } from '../constants/colors';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.error}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            
            {this.state.error?.message?.includes('Supabase') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Troubleshooting:</Text>
                <Text style={styles.tip}>
                  • Check your internet connection
                </Text>
                <Text style={styles.tip}>
                  • Make sure Supabase is running and accessible
                </Text>
                <Text style={styles.tip}>
                  • Verify your environment variables are correctly set
                </Text>
              </View>
            )}

            <View style={styles.buttons}>
              <Button
                title="Try Again"
                onPress={this.handleReset}
                color={COLORS.primary}
              />
              <View style={styles.buttonSpacer} />
              <Button
                title="Report Issue"
                onPress={() => {
                  const subject = 'App Error Report';
                  const body = `Error: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack}`;
                  Linking.openURL(
                    `mailto:support@example.com?subject=${encodeURIComponent(
                      subject
                    )}&body=${encodeURIComponent(body)}`
                  );
                }}
                color={COLORS.secondary}
              />
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  error: {
    color: COLORS.error,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.text.primary,
  },
  tip: {
    color: COLORS.text.secondary,
    marginBottom: 4,
    fontSize: 14,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonSpacer: {
    width: 16,
  },
});

export default ErrorBoundary;
