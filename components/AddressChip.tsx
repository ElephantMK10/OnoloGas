import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS } from '../constants/colors';

interface Props {
  text: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function AddressChip({ text, onPress, style }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, style] as any}>
      <Text style={styles.text} numberOfLines={1}>
        {text}
      </Text>
      <Text style={styles.change}>Change</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  text: { flex: 1, color: COLORS.text.white },
  change: { color: COLORS.primary, fontWeight: '600' },
});


