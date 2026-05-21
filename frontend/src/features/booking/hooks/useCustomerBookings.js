import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../api/booking.api';

const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractMeta = (payload, fallbackLength) => {
  const meta = payload?.meta || payload?.pagination || {};
  return {
    total: meta.total ?? payload?.total ?? fallbackLength,
    page: meta.page ?? payload?.page ?? 1,
    limit: meta.limit ?? payload?.limit ?? fallbackLength,
    totalPages: meta.totalPages ?? payload?.totalPages ?? 1,
    hasMore: meta.hasMore ?? payload?.hasMore ?? false,
  };
};

export const useCustomerBookings = (filters) =>
  useQuery({
    queryKey: ['customer-bookings', filters],
    queryFn: async () => {
      const payload = await bookingApi.list(filters);
      const bookings = toArray(payload, ['bookings']);
      return {
        bookings,
        meta: extractMeta(payload, bookings.length),
      };
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => bookingApi.cancel({ id, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-bookings'] }),
  });
};

