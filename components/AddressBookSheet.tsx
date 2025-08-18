import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS } from '../constants/colors';
import CustomIcon from './CustomIcon';
import Button from './Button';
import AddressAutocomplete from './AddressAutocomplete';
import type { Address } from '../services/interfaces/IAddressService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  onClose: () => void;
  addresses: Address[];
  onAdd: (payload: Partial<Address> & { line1: string; isDefault?: boolean }) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect?: (addr: Address) => void; // for checkout selection
}

export default function AddressBookSheet({ visible, onClose, addresses, onAdd, onSetDefault, onDelete, onSelect }: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ line1: string; label?: string | null }>({ line1: '' });

  const defaultAddress = useMemo(() => addresses.find(a => a.isDefault) || null, [addresses]);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.bottom, 16) + 24 : 0}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Address Book</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <CustomIcon name="close" size={22} color={COLORS.text.white} />
            </TouchableOpacity>
          </View>

          {!adding ? (
            <>
              <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom + 24 : 16 }} keyboardShouldPersistTaps="handled">
                {addresses.length === 0 && (
                  <Text style={styles.emptyText}>No saved addresses yet.</Text>
                )}
                {addresses.map((a) => (
                  <View key={a.id} style={styles.item}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemLabel}>{a.label || 'Address'}</Text>
                      <Text style={styles.itemText}>{[a.line1, a.city].filter(Boolean).join(', ')}</Text>
                      {a.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
                    </View>
                    {onSelect && (
                      <TouchableOpacity onPress={() => onSelect(a)} style={styles.actionBtn}>
                        <Text style={styles.actionText}>Select</Text>
                      </TouchableOpacity>
                    )}
                    {!a.isDefault && (
                      <TouchableOpacity onPress={() => onSetDefault(a.id)} style={styles.actionBtn}>
                        <Text style={styles.actionText}>Make Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => onDelete(a.id)} style={styles.dangerBtn}>
                      <Text style={styles.dangerText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              <Button title="Add new address" onPress={() => setAdding(true)} />
            </>
          ) : (
            <View style={{ gap: 12 }}>
              <AddressAutocomplete
                value={draft.line1}
                onAddressSelect={(featureOrString: any) => {
                  if (typeof featureOrString === 'string') {
                    setDraft({ ...draft, line1: featureOrString });
                  } else {
                    const place = featureOrString;
                    setDraft({ ...draft, line1: place.place_name || '' });
                  }
                }}
                placeholder="Start typing your address..."
              />
              <Button
                title="Save as default"
                onPress={() => {
                  if (!draft.line1.trim()) return;
                  onAdd({ line1: draft.line1, label: draft.label || null, isDefault: true });
                  setAdding(false);
                  setDraft({ line1: '' });
                }}
              />
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setAdding(false);
                  setDraft({ line1: '' });
                }}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: COLORS.text.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  closeBtn: { marginLeft: 'auto' },
  emptyText: { color: COLORS.text.gray, marginBottom: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
    gap: 8,
  },
  itemLabel: { color: COLORS.text.white, fontWeight: 'bold' },
  itemText: { color: COLORS.text.gray },
  defaultBadge: { color: COLORS.primary, fontSize: 12, marginTop: 2 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: COLORS.primary + '20', borderRadius: 8 },
  actionText: { color: COLORS.primary, fontWeight: '600' },
  dangerBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: COLORS.error + '20', borderRadius: 8 },
  dangerText: { color: COLORS.error, fontWeight: '600' },
});


