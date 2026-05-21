import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const useAdminReports = (filters = {}) => {
  const overviewQuery = useQuery({
    queryKey: ['admin-reports-overview', filters],
    queryFn: () => adminApi.reportsOverview(filters),
    retry: 1,
  });

  const bookingsQuery = useQuery({
    queryKey: ['admin-reports-bookings', filters],
    queryFn: () => adminApi.reportsBookings(filters),
    retry: 1,
  });

  const servicesQuery = useQuery({
    queryKey: ['admin-reports-services', filters],
    queryFn: () => adminApi.reportsServices(filters),
    retry: 1,
  });

  const providersQuery = useQuery({
    queryKey: ['admin-reports-providers', filters],
    queryFn: () => adminApi.reportsProviders(filters),
    retry: 1,
  });

  const usersQuery = useQuery({
    queryKey: ['admin-reports-users', filters],
    queryFn: () => adminApi.reportsUsers(filters),
    retry: 1,
  });

  const paymentsQuery = useQuery({
    queryKey: ['admin-reports-payments', filters],
    queryFn: () => adminApi.reportsPayments(filters),
    retry: 1,
  });

  return {
    overviewQuery,
    bookingsQuery,
    servicesQuery,
    providersQuery,
    usersQuery,
    paymentsQuery,
  };
};
