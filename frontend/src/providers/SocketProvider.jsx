import { useEffect, useMemo, useState } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import { SocketContext } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { SOCKET_EVENTS } from '../constants/socket-events.constant';
import { disconnectSocket, getSocket } from '../lib/socket';
import { appToast } from '../lib/toast';
import { getAccessToken } from '../utils/storage';

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      queueMicrotask(() => {
        setSocket(null);
        setConnected(false);
        setNotifications([]);
      });
      return undefined;
    }

    const instance = getSocket(getAccessToken());

    const onConnect = () => {
      setConnected(true);
      instance.emit('join', { userId: user.id, role: user.role });
      instance.emit('joinPublic');
    };

    const onDisconnect = () => setConnected(false);
    const onNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      appToast.success(notification?.title || 'New update received');
    };

    instance.on('connect', onConnect);
    instance.on('disconnect', onDisconnect);
    instance.on(SOCKET_EVENTS.notificationNew, onNotification);
    instance.connect();
    queueMicrotask(() => setSocket(instance));

    return () => {
      instance.off('connect', onConnect);
      instance.off('disconnect', onDisconnect);
      instance.off(SOCKET_EVENTS.notificationNew, onNotification);
      instance.disconnect();
      queueMicrotask(() => setConnected(false));
    };
  }, [isAuthenticated, user]);

  const socketValue = useMemo(() => ({ socket, connected }), [connected, socket]);

  const notificationValue = useMemo(
    () => ({
      notifications,
      setNotifications,
      unreadCount: notifications.filter((item) => !item.isRead && !item?.isArchived).length,
    }),
    [notifications]
  );

  return (
    <SocketContext.Provider value={socketValue}>
      <NotificationContext.Provider value={notificationValue}>{children}</NotificationContext.Provider>
    </SocketContext.Provider>
  );
}
