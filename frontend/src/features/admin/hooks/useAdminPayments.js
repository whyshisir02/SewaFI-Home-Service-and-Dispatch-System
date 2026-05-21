import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const useAdminPayments = (filters = {}) => {
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ['admin-payments', filters],
    queryFn: () => adminApi.payments(filters),
  });

  const paymentStatsQuery = useQuery({
    queryKey: ['admin-payment-stats'],
    queryFn: adminApi.paymentStats,
    retry: 1,
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: adminApi.resolvePaymentDispute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-stats'] });
    },
  });

  const settleProviderMutation = useMutation({
    mutationFn: adminApi.settleProviderPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-stats'] });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: adminApi.updatePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-stats'] });
    },
  });

  return {
    paymentsQuery,
    paymentStatsQuery,
    resolveDisputeMutation,
    settleProviderMutation,
    updatePaymentMutation,
  };
};

export const useAdminPaymentDetails = (id) =>
  useQuery({
    queryKey: ['admin-payment-details', id],
    queryFn: () => adminApi.paymentDetails(id),
    enabled: Boolean(id),
  });
