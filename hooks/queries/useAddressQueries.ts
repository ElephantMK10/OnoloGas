import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addressService } from '../../services/addresses/AddressService';
import type { Address, UpsertAddressPayload } from '../../services/interfaces/IAddressService';
import { queryKeys } from '../../utils/queryClient';

export const addressKeys = {
  list: (userId: string) => ['user', userId, 'addresses'] as const,
  defaults: (userId: string) => ['user', userId, 'default-address'] as const,
};

export function useAddresses(userId: string) {
  return useQuery<Address[]>({
    queryKey: addressKeys.list(userId),
    queryFn: () => addressService.listAddresses(userId),
    enabled: !!userId && !userId.startsWith('guest-'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDefaultAddress(userId: string) {
  return useQuery<Address | null>({
    queryKey: addressKeys.defaults(userId),
    queryFn: async () => {
      const list = await addressService.listAddresses(userId);
      return list.find(a => a.isDefault) || list[0] || null;
    },
    enabled: !!userId && !userId.startsWith('guest-'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpsertAddress(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertAddressPayload) => addressService.upsertAddress(userId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressKeys.list(userId) });
      qc.invalidateQueries({ queryKey: addressKeys.defaults(userId) });
    },
  });
}

export function useSetDefaultAddress(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => addressService.setDefaultAddress(userId, addressId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressKeys.list(userId) });
      qc.invalidateQueries({ queryKey: addressKeys.defaults(userId) });
    },
  });
}

export function useDeleteAddress(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => addressService.deleteAddress(userId, addressId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressKeys.list(userId) });
      qc.invalidateQueries({ queryKey: addressKeys.defaults(userId) });
    },
  });
}


