import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constant';
import { useAuth } from '../../context/AuthContext';
import { useNotificationsContext } from '../../context/NotificationContext';
import { Dropdown } from '../ui/Overlay/Dropdown';

const notificationsRouteByRole = {
  CUSTOMER: ROUTES.customer.notifications,
  PROVIDER: ROUTES.provider.notifications,
  ADMIN: ROUTES.admin.notifications,
};

export function NotificationDropdown() {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotificationsContext();
  const navigate = useNavigate();
  const notificationsPath = notificationsRouteByRole[user?.role] || ROUTES.home;

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
              { label: 'No new notifications', onClick: () => {} },
              { label: 'View notifications', onClick: () => navigate(notificationsPath) },
            ]
      }
    />
  );
}

export default NotificationDropdown;
