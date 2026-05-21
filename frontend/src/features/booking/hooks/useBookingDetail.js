import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocketContext } from '../../../context/SocketContext';
import { SOCKET_EVENTS } from '../../../constants/socket-events.constant';
import { bookingApi } from '../api/booking.api';
import { adminApi } from '../../admin/api/admin.api';

const activeStatuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'];

const getTimelineArray = (payload, booking) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.history)) return payload.history;
  if (Array.isArray(payload?.timeline)) return payload.timeline;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(booking?.statusHistory)) return booking.statusHistory;
  return [];
};

const getEndpointSet = (role) => {
  if (role === 'admin') {
    return {
      detail: adminApi.bookingDetails,
      timeline: adminApi.bookingTimeline,
      cancel: ({ id, reason }) => adminApi.cancelBooking({ id, reason }),
      updateStatus: ({ id, status }) => adminApi.updateBookingStatus({ id, status }),
    };
  }

  return {
    detail: bookingApi.details,
    timeline: bookingApi.timeline,
    cancel: ({ id, reason }) => bookingApi.cancel({ id, reason }),
    updateStatus: ({ id, status }) => bookingApi.updateStatus({ id, status }),
  };
};

export const useBookingDetail = ({ id, role = 'customer' }) => {
  const apiSet = getEndpointSet(role);
  const queryClient = useQueryClient();
  const { socket } = useSocketContext();

  const detailQuery = useQuery({
    queryKey: ['booking-detail', role, id],
    queryFn: () => apiSet.detail(id),
    enabled: Boolean(id),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return activeStatuses.includes(status) ? 30_000 : false;
    },
    retry: 1,
  });

  const timelineQuery = useQuery({
    queryKey: ['booking-detail-timeline', role, id],
    queryFn: () => apiSet.timeline(id),
    enabled: Boolean(id),
    retry: 1,
  });

  const cancelMutation = useMutation({
    mutationFn: apiSet.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-detail', role, id] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail-timeline', role, id] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: apiSet.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-detail', role, id] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail-timeline', role, id] });
    },
  });

  useEffect(() => {
    if (!socket || !id) return undefined;
    const refetchIfMatch = (payload) => {
      const payloadId = payload?.bookingId || payload?.id;
      if (String(payloadId) !== String(id)) return;
      queryClient.invalidateQueries({ queryKey: ['booking-detail', role, id] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail-timeline', role, id] });
    };

    socket.on(SOCKET_EVENTS.customer.bookingStatusUpdated, refetchIfMatch);
    socket.on(SOCKET_EVENTS.customer.bookingAccepted, refetchIfMatch);
    socket.on(SOCKET_EVENTS.customer.bookingCancelled, refetchIfMatch);
    socket.on(SOCKET_EVENTS.customer.bookingCompleted, refetchIfMatch);
    socket.on('booking:dispatch-updated', refetchIfMatch);
    socket.on(SOCKET_EVENTS.notificationNew, refetchIfMatch);

    return () => {
      socket.off(SOCKET_EVENTS.customer.bookingStatusUpdated, refetchIfMatch);
      socket.off(SOCKET_EVENTS.customer.bookingAccepted, refetchIfMatch);
      socket.off(SOCKET_EVENTS.customer.bookingCancelled, refetchIfMatch);
      socket.off(SOCKET_EVENTS.customer.bookingCompleted, refetchIfMatch);
      socket.off('booking:dispatch-updated', refetchIfMatch);
      socket.off(SOCKET_EVENTS.notificationNew, refetchIfMatch);
    };
  }, [id, queryClient, role, socket]);

  return {
    detailQuery,
    timelineQuery,
    cancelMutation,
    updateStatusMutation,
    timeline: getTimelineArray(timelineQuery.data, detailQuery.data),
  };
};

