import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const useAdminAnalytics = () => {
  const revenueQuery = useQuery({ queryKey: ['admin-analytics-revenue'], queryFn: adminApi.revenueChart });
  const categoriesQuery = useQuery({ queryKey: ['admin-analytics-categories'], queryFn: adminApi.categoryChart });
  const bookingStatusQuery = useQuery({ queryKey: ['admin-analytics-booking-status'], queryFn: adminApi.bookingStatusChart });

  return { revenueQuery, categoriesQuery, bookingStatusQuery };
};
