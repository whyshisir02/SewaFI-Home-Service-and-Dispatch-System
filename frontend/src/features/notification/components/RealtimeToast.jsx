import { useEffect } from 'react';
import { useNotificationsContext } from '../../../context/NotificationContext';
import { appToast } from '../../../lib/toast';

export function RealtimeToast() {
  const { notifications } = useNotificationsContext();

  useEffect(() => {
    if (!notifications.length) return;
    const latest = notifications[0];
    if (latest?.title) {
      appToast.success(latest.title);
    }
  }, [notifications]);

  return null;
}

export default RealtimeToast;
