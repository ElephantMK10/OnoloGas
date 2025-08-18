export interface Address {
  id: string;
  userId: string;
  label?: string | null;
  line1: string;
  line2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  placeId?: string | null;
  isDefault: boolean;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertAddressPayload {
  id?: string;
  label?: string | null;
  line1: string;
  line2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  placeId?: string | null;
  isDefault?: boolean;
}

export interface IAddressService {
  listAddresses(userId: string): Promise<Address[]>;
  upsertAddress(userId: string, payload: UpsertAddressPayload): Promise<Address>;
  setDefaultAddress(userId: string, addressId: string): Promise<void>;
  deleteAddress(userId: string, addressId: string): Promise<void>;
}


