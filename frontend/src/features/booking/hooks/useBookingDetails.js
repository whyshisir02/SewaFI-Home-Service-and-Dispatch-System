import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '../api/booking.api';

export const useBookingDetails = (id) =>
  useQuery({
    queryKey: ['booking-details', id],
    queryFn: () => bookingApi.details(id),
    enabled: Boolean(id),
  });
