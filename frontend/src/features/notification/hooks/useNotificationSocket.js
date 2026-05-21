import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketContext } from '../../../context/SocketContext';
import { SOCKET_EVENTS } from '../../../constants/socket-events.constant';

export const useNotificationSocket = () => {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) {
      // TODO: Replace polling fallback with Socket.IO notification events when backend event contract is finalized.
      const intervalId = window.setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      }, 45_000);
      return () => window.clearInterval(intervalId);
    }

    const handleNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };

    socket.on(SOCKET_EVENTS.notificationNew, handleNotification);
    socket.on(SOCKET_EVENTS.customer.bookingStatusUpdated, handleNotification);
    socket.on(SOCKET_EVENTS.customer.bookingAccepted, handleNotification);
    socket.on(SOCKET_EVENTS.provider.newNearbyJob, handleNotification);
    socket.on(SOCKET_EVENTS.admin.newBooking, handleNotification);

    return () => {
      socket.off(SOCKET_EVENTS.notificationNew, handleNotification);
      socket.off(SOCKET_EVENTS.customer.bookingStatusUpdated, handleNotification);
      socket.off(SOCKET_EVENTS.customer.bookingAccepted, handleNotification);
      socket.off(SOCKET_EVENTS.provider.newNearbyJob, handleNotification);
      socket.off(SOCKET_EVENTS.admin.newBooking, handleNotification);
    };
  }, [queryClient, socket]);
};
