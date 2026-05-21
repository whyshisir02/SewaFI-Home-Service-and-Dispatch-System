import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketContext } from '../../../context/SocketContext';
import { SOCKET_EVENTS } from '../../../constants/socket-events.constant';

export const useBookingSocket = () => {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return undefined;

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] });
    };

    [
      SOCKET_EVENTS.customer.bookingCreated,
      SOCKET_EVENTS.customer.bookingSearchingProvider,
      SOCKET_EVENTS.customer.bookingAccepted,
      SOCKET_EVENTS.customer.bookingStatusUpdated,
      SOCKET_EVENTS.customer.bookingCompleted,
      SOCKET_EVENTS.customer.bookingCancelled,
      SOCKET_EVENTS.provider.backendNewJob,
      SOCKET_EVENTS.provider.backendJobTaken,
    ].forEach((eventName) => socket.on(eventName, refresh));

    return () => {
      [
        SOCKET_EVENTS.customer.bookingCreated,
        SOCKET_EVENTS.customer.bookingSearchingProvider,
        SOCKET_EVENTS.customer.bookingAccepted,
        SOCKET_EVENTS.customer.bookingStatusUpdated,
        SOCKET_EVENTS.customer.bookingCompleted,
        SOCKET_EVENTS.customer.bookingCancelled,
        SOCKET_EVENTS.provider.backendNewJob,
        SOCKET_EVENTS.provider.backendJobTaken,
      ].forEach((eventName) => socket.off(eventName, refresh));
    };
  }, [queryClient, socket]);
};
