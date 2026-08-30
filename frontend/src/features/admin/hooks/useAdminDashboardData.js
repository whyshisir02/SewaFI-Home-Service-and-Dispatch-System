import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';
import { notificationApi } from '../../notification/api/notification.api';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';

export const adminDashboardKeys = {
  stats: ['admin-stats'],
  revenueChart: ['admin-revenue-chart'],
  categoryChart: ['admin-category-chart'],
  bookingStatusChart: ['admin-booking-status-chart'],
  recentBookings: ['admin-recent-bookings'],
  pendingProviders: ['admin-pending-providers'],
  recentUsers: ['admin-recent-users'],
  notifications: ['notifications'],
};

export const useAdminDashboardData = () => {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: adminDashboardKeys.stats,
    queryFn: adminApi.stats,
    staleTime: 60_000,
  });

  const revenueChartQuery = useQuery({
    queryKey: adminDashboardKeys.revenueChart,
    queryFn: adminApi.revenueChart,
    staleTime: 300_000,
  });

  const categoryChartQuery = useQuery({
    queryKey: adminDashboardKeys.categoryChart,
    queryFn: adminApi.categoryChart,
    staleTime: 300_000,
  });

  const bookingStatusChartQuery = useQuery({
    queryKey: adminDashboardKeys.bookingStatusChart,
    queryFn: adminApi.bookingStatusChart,
    staleTime: 300_000,
  });

  const recentBookingsQuery = useQuery({
    queryKey: adminDashboardKeys.recentBookings,
    queryFn: adminApi.recentBookings,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const pendingProvidersQuery = useQuery({
    queryKey: adminDashboardKeys.pendingProviders,
    queryFn: adminApi.pendingProviders,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const recentUsersQuery = useQuery({
    queryKey: adminDashboardKeys.recentUsers,
    queryFn: () => adminApi.users(),
    staleTime: 60_000,
  });

  const notificationsQuery = useQuery({
    queryKey: adminDashboardKeys.notifications,
    queryFn: notificationApi.list,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const refreshAdminDashboard = () => {
    Object.values(adminDashboardKeys).forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
  };

  const approveProviderMutation = useMutation({
    mutationFn: adminApi.approveProvider,
    onSuccess: () => {
      refreshAdminDashboard();
      appToast.success('Provider approved');
    },
    onError: (error) => {
      appToast.error(getErrorMessage(error, 'Unable to approve provider.'));
    },
  });

  return {
    statsQuery,
    revenueChartQuery,
    categoryChartQuery,
    bookingStatusChartQuery,
    recentBookingsQuery,
    pendingProvidersQuery,
    recentUsersQuery,
    notificationsQuery,
    approveProviderMutation,
    refreshAdminDashboard,
  };
};
