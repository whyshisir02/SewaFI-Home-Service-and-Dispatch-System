import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../features/booking/api/booking.api';
import { useSocketContext } from '../context/SocketContext';
import { SOCKET_EVENTS } from '../constants/socket-events.constant';
import { appToast } from '../lib/toast';
import { getErrorMessage } from '../utils/errorHandler';

const activeStatuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'];

export const useBookingTracking = (bookingId) =>
  useQuery({
    queryKey: ['booking-details', bookingId],
    queryFn: () => bookingApi.details(bookingId),
    enabled: Boolean(bookingId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      // TODO: Remove polling fallback once all booking lifecycle events consistently emit booking:update.
      const status = query.state.data?.status;
      return activeStatuses.includes(status) ? 20_000 : false;
    },
    retry: 1,
  });

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookingApi.cancel,
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['booking-details', booking?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
      appToast.success('Booking cancelled successfully.');
    },
    onError: (error) => appToast.error(getErrorMessage(error, 'Unable to cancel booking.')),
  });
};

export const useBookingTrackingSocket = (bookingId) => {
  const { socket, connected } = useSocketContext();
  const queryClient = useQueryClient();
  const [trackingLocations, setTrackingLocations] = useState({});
  const [trackingMessage, setTrackingMessage] = useState('');

  useEffect(() => {
    if (!socket || !bookingId) return undefined;

    const bookingMatches = (payload) => {
      const payloadId = payload?.bookingId || payload?.id;
      return payloadId === bookingId;
    };

    const refreshBooking = (payload) => {
      if (!bookingMatches(payload)) return;
      queryClient.invalidateQueries({ queryKey: ['booking-details', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    };

    const onTrackingSnapshot = (payload) => {
      if (!bookingMatches(payload)) return;
      setTrackingLocations(payload.locations || {});
      setTrackingMessage('');
    };

    const onTrackingUpdate = (payload) => {
      if (!bookingMatches(payload)) return;
      setTrackingLocations((current) => ({
        ...current,
        [payload.actorRole]: payload.location,
      }));
      setTrackingMessage('');
    };

    const onTrackingStop = (payload) => {
      if (!bookingMatches(payload)) return;
      setTrackingLocations((current) => {
        const next = { ...current };
        delete next[payload.actorRole];
        return next;
      });
    };

    const onTrackingError = (payload) => {
      if (!bookingMatches(payload)) return;
      setTrackingMessage(payload.message || 'Live tracking is not available yet.');
    };

    socket.emit(SOCKET_EVENTS.tracking.subscribe, { bookingId });
    socket.on('booking:update', refreshBooking);
    socket.on(SOCKET_EVENTS.customer.bookingAccepted, refreshBooking);
    socket.on(SOCKET_EVENTS.customer.bookingStatusUpdated, refreshBooking);
    socket.on(SOCKET_EVENTS.customer.bookingCompleted, refreshBooking);
    socket.on(SOCKET_EVENTS.customer.bookingCancelled, refreshBooking);
    socket.on(SOCKET_EVENTS.tracking.snapshot, onTrackingSnapshot);
    socket.on(SOCKET_EVENTS.tracking.update, onTrackingUpdate);
    socket.on(SOCKET_EVENTS.tracking.stop, onTrackingStop);
    socket.on(SOCKET_EVENTS.tracking.error, onTrackingError);

    return () => {
      socket.off('booking:update', refreshBooking);
      socket.off(SOCKET_EVENTS.customer.bookingAccepted, refreshBooking);
      socket.off(SOCKET_EVENTS.customer.bookingStatusUpdated, refreshBooking);
      socket.off(SOCKET_EVENTS.customer.bookingCompleted, refreshBooking);
      socket.off(SOCKET_EVENTS.customer.bookingCancelled, refreshBooking);
      socket.off(SOCKET_EVENTS.tracking.snapshot, onTrackingSnapshot);
      socket.off(SOCKET_EVENTS.tracking.update, onTrackingUpdate);
      socket.off(SOCKET_EVENTS.tracking.stop, onTrackingStop);
      socket.off(SOCKET_EVENTS.tracking.error, onTrackingError);
    };
  }, [bookingId, queryClient, socket]);

  return useMemo(
    () => ({
      connected,
      trackingLocations,
      trackingMessage,
    }),
    [connected, trackingLocations, trackingMessage]
  );
};
