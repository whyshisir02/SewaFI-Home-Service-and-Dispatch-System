import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { NotificationItem } from './NotificationItem';

export function NotificationList({ notifications = [] }) {
  if (!notifications.length) {
    return <EmptyState title="No notifications" description="Updates from bookings, approvals, and payment events will appear here." />;
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id || notification.createdAt} notification={notification} />
      ))}
    </div>
  );
}

export default NotificationList;
