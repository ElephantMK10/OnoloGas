import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import CustomIcon from './CustomIcon';

interface MenuOptionProps {
  title: string;
  onPress: () => void;
  icon?: string;
}

export default function MenuOption({ title, onPress, icon }: MenuOptionProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.dot}>
        <View style={styles.innerDot} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {icon && <CustomIcon name={icon as any} size={20} color={COLORS.text.gray} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 16,
    flex: 1,
  },
});
