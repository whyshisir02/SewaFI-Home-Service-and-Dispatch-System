import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '../api/booking.api';

export const useMyBookings = () =>
  useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingApi.list,
  });
