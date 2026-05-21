import { Link } from 'react-router-dom';
import { BellRing, Clock3 } from 'lucide-react';
import { Skeleton } from '../ui/Feedback/Skeleton';
import { formatDate } from '../../utils/formatDate';

const getPath = (notification) => notification?.bookingId ? `/provider/jobs/${notification.bookingId}` : null;

export function ProviderNotificationsPreview({ notifications = [], isLoading, isError }) {
  if (isLoading) {
    return (
      <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
        <Skeleton className="h-8 w-44" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[0_16px_40px_rgba(7,59,115,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Today overview</p>
          <h2 className="mt-1 text-2xl font-extrabold text-[var(--sf-text-main)]">Notifications</h2>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]">
          <BellRing className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      {isError ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load notifications.</p>
          <p className="mt-1 text-sm text-[var(--sf-text-muted)]">Please refresh the dashboard to try again.</p>
        </div>
      ) : null}

      {!isError && !notifications.length ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5 text-sm leading-6 text-[var(--sf-text-muted)]">
          No notifications yet.
        </div>
      ) : null}

      {!isError && notifications.length ? (
        <div className="mt-5 space-y-3">
          {notifications.slice(0, 5).map((notification) => {
            const path = getPath(notification);
            const content = (
              <div className="flex gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4 transition hover:border-[var(--sf-secondary)]">
                <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-[var(--sf-text-main)]">{notification.title || notification.type || 'Notification'}</h3>
                    {notification.isRead === false ? (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--sf-secondary)]" aria-label="Unread notification" />
                    ) : null}
                  </div>
                  {notification.message || notification.body ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--sf-text-muted)]">{notification.message || notification.body}</p>
                  ) : null}
                  {notification.createdAt ? (
                    <p className="mt-2 text-xs font-medium text-[var(--sf-text-soft)]">{formatDate(notification.createdAt, { includeTime: true })}</p>
                  ) : null}
                </div>
              </div>
            );

            return path ? (
              <Link key={notification.id || `${notification.title}-${notification.createdAt}`} to={path} className="block focus:outline-none focus:ring-2 focus:ring-[var(--sf-secondary)]">
                {content}
              </Link>
            ) : (
              <div key={notification.id || `${notification.title}-${notification.createdAt}`}>{content}</div>
            );
          })}
        </div>
      ) : null}

      {/* TODO: Add /provider/notifications route when the provider notification center page is available. */}
    </section>
  );
}

export default ProviderNotificationsPreview;
