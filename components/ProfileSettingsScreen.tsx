import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import CustomIcon from './CustomIcon';
import { COLORS } from '../constants/colors';
import { NotificationsSettings } from './settings/NotificationsSettings';
import { PrivacySecuritySettings } from './settings/PrivacySecuritySettings';
import { useRouter } from 'expo-router';

export default function ProfileSettingsScreen({
  settingsScreen,
  setSettingsScreen,
  notificationSettings,
  notificationPreferences,
  onUpdateSettings,
  user,
  onSetUpTwoFactor,
  onLogout,
  onNewGuestSession,
}: {
  settingsScreen: string;
  setSettingsScreen: (screen: string) => void;
  notificationSettings: any;
  notificationPreferences: any;
  onUpdateSettings: (updates: any) => void;
  user: any;
  onSetUpTwoFactor: () => void;
  onLogout?: () => void;
  onNewGuestSession?: () => void;
}) {
  const router = useRouter();

  switch (settingsScreen) {
    case 'notifications':
      return (
        <NotificationsSettings
          notificationSettings={notificationSettings}
          notificationPreferences={notificationPreferences}
          onBack={() => setSettingsScreen('main')}
          onUpdateSettings={onUpdateSettings}
        />
      );
    case 'privacy':
      return (
        <PrivacySecuritySettings
          securitySettings={user?.securitySettings}
          onBack={() => setSettingsScreen('main')}
          onUpdateSettings={onUpdateSettings}
          onChangePassword={onSetUpTwoFactor}
          onSetUpTwoFactor={onSetUpTwoFactor}
        />
      );
    case 'help':
      return (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
            onPress={() => setSettingsScreen('main')}
          >
            <CustomIcon name="arrow-back" size={24} color={COLORS.text.white} />
            <Text style={{ color: COLORS.text.white, fontSize: 16, marginLeft: 12 }}>Back to Settings</Text>
          </TouchableOpacity>
          
          <Text style={{ color: COLORS.text.white, fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Help & Support</Text>
          
          <View style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: COLORS.text.white, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Contact Information</Text>
            <Text style={{ color: COLORS.text.gray, fontSize: 14, marginBottom: 8 }}>📞 Phone: +27 11 464 5073</Text>
            <Text style={{ color: COLORS.text.gray, fontSize: 14, marginBottom: 8 }}>📧 Email: info@onologroup.com</Text>
            <Text style={{ color: COLORS.text.gray, fontSize: 14, marginBottom: 8 }}>🌐 Website: www.onologroup.com</Text>
          </View>
          
          <View style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: COLORS.text.white, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Business Hours</Text>
            <Text style={{ color: COLORS.text.gray, fontSize: 14, marginBottom: 8 }}>Monday - Sunday: 7:00 AM - 10:00 PM</Text>
            <Text style={{ color: COLORS.text.gray, fontSize: 14, marginBottom: 8 }}>Emergency deliveries available 24/7</Text>
          </View>
          
          <View style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: COLORS.text.white, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Common Questions</Text>
            <Text style={{ color: COLORS.text.gray, fontSize: 14, marginBottom: 8 }}>• How do I place an order?</Text>
            <Text style={{ color: COLORS.text.gray, fontSize: 14, marginBottom: 8 }}>• What payment methods do you accept?</Text>
            <Text style={{ color: COLORS.text.gray, fontSize: 14, marginBottom: 8 }}>• How long does delivery take?</Text>
            <Text style={{ color: COLORS.text.gray, fontSize: 14, marginBottom: 8 }}>• Can I cancel my order?</Text>
          </View>
          
          <View style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: 16 }}>
            <Text style={{ color: COLORS.text.white, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Need More Help?</Text>
            <Text style={{ color: COLORS.text.gray, fontSize: 14, lineHeight: 20 }}>
              If you need immediate assistance, please call us directly or send us an email. Our customer service team is available during business hours to help you with any questions or concerns.
            </Text>
          </View>
        </ScrollView>
      );
    case 'main':
    default:
      return (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: COLORS.text.white, fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Settings</Text>
          <View style={{ marginBottom: 24 }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
              onPress={() => setSettingsScreen('notifications')}
            >
              <CustomIcon name="notifications-outline" size={24} color={COLORS.text.white} />
              <Text style={{ color: COLORS.text.white, fontSize: 16, marginLeft: 12 }}>Notifications</Text>
              <CustomIcon name="chevron-forward" size={20} color={COLORS.text.gray} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
              onPress={() => setSettingsScreen('privacy')}
            >
              <CustomIcon name="lock-closed-outline" size={24} color={COLORS.text.white} />
              <Text style={{ color: COLORS.text.white, fontSize: 16, marginLeft: 12 }}>Privacy & Security</Text>
              <CustomIcon name="chevron-forward" size={20} color={COLORS.text.gray} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
              onPress={() => router.push('/(tabs)/chat')}
            >
              <CustomIcon name="help-circle-outline" size={24} color={COLORS.text.white} />
              <Text style={{ color: COLORS.text.white, fontSize: 16, marginLeft: 12 }}>Help & Support</Text>
              <CustomIcon name="chevron-forward" size={20} color={COLORS.text.gray} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            {onLogout && (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                onPress={onLogout}
              >
                <CustomIcon name="log-out-outline" size={24} color={COLORS.error} />
                <Text style={{ color: COLORS.error, fontSize: 16, marginLeft: 12 }}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      );
  }
} 