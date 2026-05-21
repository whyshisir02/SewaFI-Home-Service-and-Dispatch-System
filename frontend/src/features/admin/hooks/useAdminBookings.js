import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocketContext } from '../../../context/SocketContext';
import { SOCKET_EVENTS } from '../../../constants/socket-events.constant';
import { adminApi } from '../api/admin.api';

export const useAdminBookings = (filters = {}) => {
  const queryClient = useQueryClient();
  const { socket } = useSocketContext();

  const bookingsQuery = useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: () => adminApi.bookings(filters),
  });

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
  });

  const updateStatusMutation = useMutation({
    mutationFn: adminApi.updateBookingStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: adminApi.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    };
    socket.on(SOCKET_EVENTS.customer.bookingCreated, refresh);
    socket.on(SOCKET_EVENTS.customer.bookingStatusUpdated, refresh);
    socket.on(SOCKET_EVENTS.customer.bookingAccepted, refresh);
    socket.on(SOCKET_EVENTS.customer.bookingCancelled, refresh);
    socket.on(SOCKET_EVENTS.customer.bookingCompleted, refresh);
    socket.on(SOCKET_EVENTS.notificationNew, refresh);
    return () => {
      socket.off(SOCKET_EVENTS.customer.bookingCreated, refresh);
      socket.off(SOCKET_EVENTS.customer.bookingStatusUpdated, refresh);
      socket.off(SOCKET_EVENTS.customer.bookingAccepted, refresh);
      socket.off(SOCKET_EVENTS.customer.bookingCancelled, refresh);
      socket.off(SOCKET_EVENTS.customer.bookingCompleted, refresh);
      socket.off(SOCKET_EVENTS.notificationNew, refresh);
    };
  }, [queryClient, socket]);

  return { bookingsQuery, statsQuery, updateStatusMutation, cancelBookingMutation };
};

export const useAdminBookingDetails = (id) =>
  useQuery({
    queryKey: ['admin-booking-details', id],
    queryFn: () => adminApi.bookingDetails(id),
    enabled: Boolean(id),
  });

export const useAdminBookingTimeline = (id) =>
  useQuery({
    queryKey: ['admin-booking-timeline', id],
    queryFn: () => adminApi.bookingTimeline(id),
    enabled: Boolean(id),
  });

