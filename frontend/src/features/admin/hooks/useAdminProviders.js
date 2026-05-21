import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const useAdminProviders = (filters = {}) => {
  const queryClient = useQueryClient();

  const providersQuery = useQuery({
    queryKey: ['admin-providers', filters],
    queryFn: () => adminApi.providers(filters),
  });

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
  });

  const approveMutation = useMutation({
    mutationFn: adminApi.approveProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => adminApi.rejectProvider(id, reason ? { reason } : {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }) => adminApi.suspendProvider(id, reason ? { reason } : {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: adminApi.activateProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return {
    providersQuery,
    statsQuery,
    approveMutation,
    rejectMutation,
    suspendMutation,
    activateMutation,
  };
};

export const useAdminProviderDetails = (id) =>
  useQuery({
    queryKey: ['admin-provider-details', id],
    queryFn: () => adminApi.providerDetails(id),
    enabled: Boolean(id),
  });

