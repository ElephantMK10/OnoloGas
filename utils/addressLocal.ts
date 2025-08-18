import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@onolo_default_address_v1';

export type LocalAddressSnapshot = {
  line1: string;
  label?: string | null;
  city?: string | null;
};

export async function getLocalDefaultAddress(): Promise<LocalAddressSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function setLocalDefaultAddress(addr: LocalAddressSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(addr));
  } catch {}
}


