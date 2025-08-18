import { supabase } from '../../lib/supabase';
import type { Address, IAddressService, UpsertAddressPayload } from '../interfaces/IAddressService';

export class AddressService implements IAddressService {
  private static instance: AddressService;

  public static getInstance(): AddressService {
    if (!AddressService.instance) {
      AddressService.instance = new AddressService();
    }
    return AddressService.instance;
  }

  async listAddresses(userId: string): Promise<Address[]> {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false });

    if (error) {
      // Fallback for deployments where addresses table isn't migrated yet
      try {
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('address')
          .eq('id', userId)
          .single();
        if (profileErr) throw profileErr;
        const addr = (profile as any)?.address?.trim();
        if (!addr) return [];
        return [{
          id: 'profile-fallback',
          userId,
          label: 'Default',
          line1: addr,
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Address];
      } catch (e) {
        throw new Error(error.message);
      }
    }

    return (data || []).map(this.toAddress);
  }

  async upsertAddress(userId: string, payload: UpsertAddressPayload): Promise<Address> {
    // If this address will be default, unset others first (app-enforced single default)
    if (payload.isDefault) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('addresses')
      .upsert({
        id: payload.id,
        user_id: userId,
        label: payload.label,
        line1: payload.line1,
        line2: payload.line2,
        city: payload.city,
        province: payload.province,
        postal_code: payload.postalCode,
        country: payload.country ?? 'South Africa',
        lat: payload.lat,
        lng: payload.lng,
        place_id: payload.placeId,
        is_default: payload.isDefault ?? false,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error || !data) {
      // Fallback: write to profile.address for compatibility
      const addressString = payload.line1;
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ address: addressString })
        .eq('id', userId);
      if (profileErr) throw new Error(error?.message || profileErr.message || 'Failed to upsert address');
      return {
        id: 'profile-fallback',
        userId,
        label: payload.label || 'Default',
        line1: addressString,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Address;
    }
    return this.toAddress(data);
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    // Unset others, then set this one
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true, last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('id', addressId);
    if (error) throw new Error(error.message);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const { error } = await supabase.from('addresses').delete().eq('user_id', userId).eq('id', addressId);
    if (error) {
      // If fallback, nothing to delete from profiles; ignore
      return;
    }
  }

  private toAddress = (row: any): Address => ({
    id: row.id,
    userId: row.user_id,
    label: row.label,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    country: row.country,
    lat: row.lat,
    lng: row.lng,
    placeId: row.place_id,
    isDefault: !!row.is_default,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export const addressService = AddressService.getInstance();


