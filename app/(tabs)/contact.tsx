import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { COMPANY } from '../../constants/company';

export default function ContactScreen() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback to menu tab if can't go back
      router.replace('/(tabs)/menu');
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Please enter a message.');
      return;
    }
    setSending(true);
    const subject = encodeURIComponent('Contact Form Message');
    const body = encodeURIComponent(message);
    const email = COMPANY.contact.email || 'info@example.com';
    const mailto = `mailto:${email}?subject=${subject}&body=${body}`;
    try {
      await Linking.openURL(mailto);
    } catch (e) {
      Alert.alert('Could not open email client.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Contact Us</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Send us a message and we'll get back to you soon.</Text>
        <TextInput
          style={styles.input}
          placeholder="Type your message here..."
          placeholderTextColor={COLORS.text.gray}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.button, sending && { opacity: 0.6 }]}
          onPress={handleSend}
          disabled={sending}
        >
          <Text style={styles.buttonText}>{sending ? 'Sending...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40, // Same width as back button to center the title
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.gray,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.card,
    color: COLORS.text.white,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 