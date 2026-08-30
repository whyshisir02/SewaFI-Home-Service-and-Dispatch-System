import { memo } from 'react';
import { Card } from '../../../components/ui/Layout/Card';
import { Badge } from '../../../components/ui/DataDisplay/Badge';

export const NotificationItem = memo(function NotificationItem({ notification }) {
  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-foreground">{notification.title}</p>
        {!notification.isRead ? <Badge tone="primary">Unread</Badge> : <Badge>Read</Badge>}
      </div>
      <p className="text-sm text-muted">{notification.message || notification.body || 'No additional details available.'}</p>
    </Card>
  );
});

export default NotificationItem;
