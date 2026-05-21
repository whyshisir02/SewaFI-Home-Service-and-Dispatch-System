import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const useAdminDashboard = () => {
  const statsQuery = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats });
  const recentBookingsQuery = useQuery({ queryKey: ['admin-recent-bookings'], queryFn: adminApi.recentBookings });
  const revenueChartQuery = useQuery({ queryKey: ['admin-revenue-chart'], queryFn: adminApi.revenueChart });
  const categoryChartQuery = useQuery({ queryKey: ['admin-category-chart'], queryFn: adminApi.categoryChart });
  const bookingStatusChartQuery = useQuery({ queryKey: ['admin-booking-status-chart'], queryFn: adminApi.bookingStatusChart });
  const pendingProvidersQuery = useQuery({ queryKey: ['admin-pending-providers'], queryFn: adminApi.pendingProviders });

  return { statsQuery, recentBookingsQuery, revenueChartQuery, categoryChartQuery, bookingStatusChartQuery, pendingProvidersQuery };
};
