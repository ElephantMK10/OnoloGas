import React, { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { COLORS } from '../../constants/colors';
import { styles } from './settingsStyles';

type NotificationSettingsProps = {
  notificationSettings?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  notificationPreferences?: {
    orderUpdates?: boolean;
    promotions?: boolean;
    newsletter?: boolean;
  };
  onBack: () => void;
  onUpdateSettings: (settings: any) => void;
};

export const NotificationsSettings: React.FC<NotificationSettingsProps> = ({
  notificationSettings = { email: true, sms: true, push: true },
  notificationPreferences = { orderUpdates: true, promotions: true, newsletter: true },
  onBack,
  onUpdateSettings,
}) => {
  const [settings, setSettings] = useState({
    email: notificationSettings.email ?? true,
    sms: notificationSettings.sms ?? true,
    push: notificationSettings.push ?? true,
    orderUpdates: notificationPreferences.orderUpdates ?? true,
    promotions: notificationPreferences.promotions ?? true,
    newsletter: notificationPreferences.newsletter ?? true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);
    // Split settings into notificationSettings and notificationPreferences
    const { orderUpdates, promotions, newsletter, ...notificationSettings } = newSettings;
    onUpdateSettings({
      notificationSettings,
      notificationPreferences: { orderUpdates, promotions, newsletter },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Methods</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="mail-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Order updates, promotions, and more</Text>
            </View>
            <Switch
              value={settings.email}
              onValueChange={() => handleToggle('email')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.text.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="chatbubbles-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>SMS Notifications</Text>
              <Text style={styles.settingDescription}>Order status and delivery updates</Text>
            </View>
            <Switch
              value={settings.sms}
              onValueChange={() => handleToggle('sms')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.text.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Push Notifications</Text>
              <Text style={styles.settingDescription}>App updates and promotions</Text>
            </View>
            <Switch
              value={settings.push}
              onValueChange={() => handleToggle('push')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.text.white}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Order Updates</Text>
              <Text style={styles.settingDescription}>Order confirmations and status changes</Text>
            </View>
            <Switch
              value={settings.orderUpdates}
              onValueChange={() => handleToggle('orderUpdates')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.text.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Promotions & Offers</Text>
              <Text style={styles.settingDescription}>Special offers and discounts</Text>
            </View>
            <Switch
              value={settings.promotions}
              onValueChange={() => handleToggle('promotions')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.text.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Newsletter</Text>
              <Text style={styles.settingDescription}>Weekly updates and news</Text>
            </View>
            <Switch
              value={settings.newsletter}
              onValueChange={() => handleToggle('newsletter')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.text.white}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
