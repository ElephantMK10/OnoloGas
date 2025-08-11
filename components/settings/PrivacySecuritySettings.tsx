import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { COLORS } from '../../constants/colors';
import { styles } from './settingsStyles';
import { useRouter } from 'expo-router';

type PrivacySecuritySettingsProps = {
  securitySettings?: {
    biometricLogin?: boolean;
    twoFactorAuth?: boolean;
  };
  onBack: () => void;
  onUpdateSettings: (settings: any) => void;
  onChangePassword: () => void;
  onSetUpTwoFactor: () => void;
};

export const PrivacySecuritySettings: React.FC<PrivacySecuritySettingsProps> = ({
  securitySettings = { biometricLogin: false, twoFactorAuth: false },
  onBack,
  onUpdateSettings,
  onChangePassword,
  onSetUpTwoFactor,
}) => {
  const [settings, setSettings] = useState({
    biometricLogin: securitySettings.biometricLogin ?? false,
    twoFactorAuth: securitySettings.twoFactorAuth ?? false,
  });

  const router = useRouter();

  const handleToggle = (key: keyof typeof settings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };

    if (key === 'biometricLogin' && !settings[key]) {
      // Show confirmation for enabling biometric login
      Alert.alert(
        'Enable Biometric Login',
        'Do you want to enable biometric login? You can use your fingerprint or face to sign in.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: 'Enable',
            onPress: () => {
              setSettings((prev) => ({
                ...prev,
                [key]: true,
              }));
              onUpdateSettings({
                securitySettings: {
                  ...securitySettings,
                  [key]: true,
                },
              });
            },
          },
        ],
      );
    } else {
      setSettings(newSettings);
      onUpdateSettings({
        securitySettings: newSettings,
      });
    }
  };

  const handleOpenPrivacyPolicy = () => {
    router.push('/menu/privacy-policy');
  };

  const handleOpenTerms = () => {
    router.push('/menu/terms-&-conditions');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>

          <TouchableOpacity style={styles.settingItem} onPress={onChangePassword}>
            <View style={styles.settingIcon}>
              <Ionicons name="key-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Change Password</Text>
              <Text style={styles.settingDescription}>Update your account password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.gray} />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Two-Factor Authentication</Text>
              <Text style={styles.settingDescription}>Add an extra layer of security</Text>
            </View>
            <Switch
              value={settings.twoFactorAuth}
              onValueChange={() => handleToggle('twoFactorAuth')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.text.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="finger-print-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Biometric Login</Text>
              <Text style={styles.settingDescription}>Use fingerprint or face recognition</Text>
            </View>
            <Switch
              value={settings.biometricLogin}
              onValueChange={() => handleToggle('biometricLogin')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.text.white}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleOpenPrivacyPolicy}>
            <View style={styles.settingIcon}>
              <Ionicons name="document-text-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Privacy Policy</Text>
              <Text style={styles.settingDescription}>How we handle your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleOpenTerms}>
            <View style={styles.settingIcon}>
              <Ionicons name="document-lock-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Terms of Service</Text>
              <Text style={styles.settingDescription}>Terms and conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.gray} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { marginBottom: 24 }]}>
          <Text style={styles.sectionTitle}>Data</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert(
                'Export Data',
                'Your data will be prepared for download. You will receive an email with a link to download your data.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Export',
                    onPress: () => {
                      // TODO: Implement data export
                      Alert.alert(
                        'Request Received',
                        "Your data export has been started. You will receive an email when it's ready to download.",
                        [{ text: 'OK' }],
                      );
                    },
                  },
                ],
              );
            }}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="download-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Export Data</Text>
              <Text style={styles.settingDescription}>Download a copy of your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomWidth: 0 }]}
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      // TODO: Implement account deletion
                      Alert.alert(
                        'Account Deletion',
                        'Your account has been scheduled for deletion. You will receive a confirmation email shortly.',
                        [{ text: 'OK' }],
                      );
                    },
                  },
                ],
              );
            }}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="trash-outline" size={22} color={COLORS.error} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingText, { color: COLORS.error }]}>Delete Account</Text>
              <Text style={[styles.settingDescription, { color: COLORS.error + 'CC' }]}>
                Permanently delete your account and data
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
