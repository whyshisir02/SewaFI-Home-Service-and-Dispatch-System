import { createContext, useContext } from 'react';

export const NotificationContext = createContext(null);

export const useNotificationsContext = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotificationsContext must be used within SocketProvider');
  return context;
};
