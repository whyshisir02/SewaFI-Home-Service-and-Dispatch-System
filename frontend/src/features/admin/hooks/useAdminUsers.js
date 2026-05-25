import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const useAdminUsers = (filters = {}) => {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => adminApi.users(filters),
  });

  const statsQuery = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: adminApi.userStats,
  });

  const updateStatusMutation = useMutation({
    mutationFn: adminApi.updateUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    },
  });

  return {
    usersQuery,
    statsQuery,
    updateStatusMutation,
    deleteUserMutation,
  };
};

export const useAdminUserDetails = (id) =>
  useQuery({
    queryKey: ['admin-user-details', id],
    queryFn: () => adminApi.userDetails(id),
    enabled: Boolean(id),
  });
