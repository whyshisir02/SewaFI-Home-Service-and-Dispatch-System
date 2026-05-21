import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../api/customer.api';
import { bookingApi } from '../../booking/api/booking.api';
import { notificationApi } from '../../notification/api/notification.api';
import { serviceApi } from '../../services/api/service.api';

export const useCustomerDashboard = () => {
  const summaryQuery = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: customerApi.summary,
    staleTime: 60_000,
  });

  const bookingsQuery = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingApi.list,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const servicesQuery = useQuery({
    queryKey: ['services', { featured: true, limit: 4 }],
    queryFn: () => serviceApi.list({ featured: true, limit: 4 }),
    staleTime: 300_000,
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.list,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    summaryQuery,
    bookingsQuery,
    servicesQuery,
    notificationsQuery,
  };
};
