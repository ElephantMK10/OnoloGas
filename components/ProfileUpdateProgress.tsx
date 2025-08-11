import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export interface UpdateStep {
  id: string;
  title: string;
  status: 'pending' | 'inProgress' | 'completed' | 'error';
  description?: string;
}

interface ProfileUpdateProgressProps {
  steps: UpdateStep[];
  currentStep?: string;
}

export default function ProfileUpdateProgress({ steps, currentStep }: ProfileUpdateProgressProps) {
  const getStepStatusColor = (status: UpdateStep['status']) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'inProgress':
        return COLORS.primary;
      case 'error':
        return '#EF4444';
      default:
        return COLORS.text.gray;
    }
  };

  const getStepStatusIcon = (status: UpdateStep['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'inProgress':
        return '⏳';
      case 'error':
        return '❌';
      default:
        return '⏸️';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Progress</Text>
      {steps.map((step, index) => (
        <View key={step.id} style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepIcon}>{getStepStatusIcon(step.status)}</Text>
            <Text style={[styles.stepTitle, { color: getStepStatusColor(step.status) }]}>
              {step.title}
            </Text>
          </View>
          {step.description && <Text style={styles.stepDescription}>{step.description}</Text>}
          {index < steps.length - 1 && <View style={styles.stepConnector} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepContainer: {
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepDescription: {
    color: COLORS.text.gray,
    fontSize: 12,
    marginLeft: 24,
    marginTop: 4,
  },
  stepConnector: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.border,
    marginLeft: 12,
    marginTop: 4,
  },
});
