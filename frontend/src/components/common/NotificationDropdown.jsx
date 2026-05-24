import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constant';
import { useAuth } from '../../context/AuthContext';
import { useNotificationsContext } from '../../context/NotificationContext';
import { Dropdown } from '../ui/Overlay/Dropdown';
import { useNotifications } from '../../features/notification/hooks/useNotifications';

const notificationsRouteByRole = {
  CUSTOMER: ROUTES.customer.notifications,
  PROVIDER: ROUTES.provider.notifications,
  ADMIN: ROUTES.admin.notifications,
};

export function NotificationDropdown() {
  const { user } = useAuth();
  const { notifications: socketNotifications, unreadCount: socketUnreadCount } = useNotificationsContext();
  const navigate = useNavigate();
  const notificationsPath = notificationsRouteByRole[user?.role] || ROUTES.home;
  const role = String(user?.role || '').toLowerCase();
  const { notificationsQuery, unreadCountQuery } = useNotifications({
    role,
    filters: { tab: 'active', page: 1, limit: 6 },
  });

  const activeNotifications = notificationsQuery.data?.notifications || [];
  const notifications = activeNotifications.length
    ? activeNotifications
    : (socketNotifications || []).filter((item) => !item?.isArchived).slice(0, 6);

  const unreadCountPayload = unreadCountQuery.data;
  const unreadCountFromApi =
    unreadCountPayload?.count ??
    unreadCountPayload?.unreadCount ??
    unreadCountPayload?.totalUnread ??
    (typeof unreadCountPayload === 'number' ? unreadCountPayload : 0);
  const unreadCount = Math.max(Number(unreadCountFromApi || 0), Number(socketUnreadCount || 0));

  return (
    <Dropdown
      trigger={
        <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface">
          <Bell className="h-5 w-5 text-[var(--sf-text-main)]" aria-hidden="true" />
          {unreadCount ? (
            <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          ) : null}
        </span>
      }
      items={
        notifications.length
          ? [
              ...notifications.slice(0, 6).map((item) => ({
                label: item.title || 'New update',
                onClick: () => navigate(notificationsPath),
              })),
              { label: 'View all notifications', onClick: () => navigate(notificationsPath) },
            ]
          : [
              { label: 'No new notifications.', onClick: () => {} },
              { label: 'View notifications', onClick: () => navigate(notificationsPath) },
            ]
      }
    />
  );
}

export default NotificationDropdown;
