import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableWithoutFeedback, View } from 'react-native';
import { COLORS } from '../constants/colors';
import Button from './Button';
import AddressBookSheet from './AddressBookSheet';
import { useAddresses, useDefaultAddress, useDeleteAddress, useSetDefaultAddress, useUpsertAddress } from '../hooks/queries/useAddressQueries';
import Toast from 'react-native-toast-message';
import { getLocalDefaultAddress, setLocalDefaultAddress } from '../utils/addressLocal';

export default function DeliveryTab({ userId, styles }: { userId: string; styles: any }) {
  const { data: addressList = [] } = useAddresses(userId);
  const { data: serverDefault } = useDefaultAddress(userId);
  const upsert = useUpsertAddress(userId);
  const setDefault = useSetDefaultAddress(userId);
  const del = useDeleteAddress(userId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [localDefault, setLocalDefault] = useState<{ line1: string; label?: string | null; city?: string | null } | null>(null);

  useEffect(() => {
    getLocalDefaultAddress().then(setLocalDefault);
  }, []);

  const preview = useMemo(() => {
    const d = serverDefault || (addressList[0] ?? null);
    if (d) return `${d.label ? d.label + ' • ' : ''}${[d.line1, d.city].filter(Boolean).join(', ')}`;
    if (localDefault) return `${localDefault.label ? localDefault.label + ' • ' : ''}${[localDefault.line1, localDefault.city].filter(Boolean).join(', ')}`;
    return 'Add a delivery address';
  }, [serverDefault, addressList, localDefault]);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <TouchableWithoutFeedback>
        <ScrollView
          style={styles.profileScrollView}
          contentContainerStyle={styles.profileScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Delivery</Text>
          <View style={styles.profileSection}>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Default address</Text>
              <Text style={styles.profileValue}>{preview}</Text>
            </View>
            <Button
              title={serverDefault || addressList.length > 0 || localDefault ? 'Manage addresses' : 'Add delivery address'}
              onPress={() => setSheetOpen(true)}
              style={styles.editButton}
            />
          </View>

          <AddressBookSheet
            visible={sheetOpen}
            onClose={() => setSheetOpen(false)}
            addresses={addressList}
            onAdd={async (payload) => {
              try {
                if (!userId || userId.startsWith('guest-')) {
                  await setLocalDefaultAddress({ line1: payload.line1, label: payload.label || null });
                  setLocalDefault({ line1: payload.line1, label: payload.label || null });
                } else {
                  await upsert.mutateAsync({ line1: payload.line1, label: payload.label || null, isDefault: true });
                }
                setSheetOpen(false);
                Toast.show({ type: 'success', text1: 'Address saved' });
              } catch (e: any) {
                Toast.show({ type: 'error', text1: 'Failed to save address', text2: e.message || 'Try again' });
              }
            }}
            onSetDefault={async (id) => {
              try {
                await setDefault.mutateAsync(id);
                setSheetOpen(false);
                Toast.show({ type: 'success', text1: 'Default updated' });
              } catch (e: any) {
                Toast.show({ type: 'error', text1: 'Failed to set default', text2: e.message || 'Try again' });
              }
            }}
            onDelete={async (id) => {
              try {
                await del.mutateAsync(id);
                Toast.show({ type: 'success', text1: 'Address deleted' });
              } catch (e: any) {
                Toast.show({ type: 'error', text1: 'Failed to delete', text2: e.message || 'Try again' });
              }
            }}
          />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}


