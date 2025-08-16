import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { COLORS } from '../constants/colors';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>
        Fuel <Text style={styles.white}>On</Text>
        {'\n'}Demand
      </Text>
      <Text style={styles.subtitle}>Order LPG gas refills in seconds – we'll handle the rest</Text>

      {['Fast Delivery', 'Simple Ordering', 'Secure Payment'].map((item) => (
        <View key={item} style={styles.bullet}>
          <View style={styles.dot} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}

      <View style={styles.authButtons}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => router.push('/auth/login' as Href)}
        >
          <Text style={styles.btnTxt}>Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push('/auth/register' as Href)}
        >
          <Text style={[styles.btnTxt, { color: COLORS.primary }]}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 120,
  },
  headline: {
    fontSize: 64,
    fontWeight: '900',
    color: COLORS.primary,
    lineHeight: 70,
  },
  white: {
    color: '#FFFFFF',
  },
  subtitle: {
    color: COLORS.text.gray,
    fontSize: 20,
    marginVertical: 24,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  bulletText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  btnTxt: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  authButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  secondaryButton: {
    backgroundColor: '#2A2A2A',
  },
});
