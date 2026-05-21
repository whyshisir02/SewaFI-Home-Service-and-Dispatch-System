import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addressApi } from '../api/address.api';

export const CUSTOMER_ADDRESSES_QUERY_KEY = ['customer-addresses'];

export const useCustomerAddresses = () =>
  useQuery({
    queryKey: CUSTOMER_ADDRESSES_QUERY_KEY,
    queryFn: addressApi.list,
    retry: 1,
    staleTime: 30 * 1000,
  });

export const useAddressActions = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: CUSTOMER_ADDRESSES_QUERY_KEY });
  };

  const createMutation = useMutation({
    mutationFn: addressApi.create,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: addressApi.update,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: addressApi.remove,
    onSuccess: invalidate,
  });

  const defaultMutation = useMutation({
    mutationFn: addressApi.setDefault,
    onSuccess: invalidate,
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    defaultMutation,
  };
};