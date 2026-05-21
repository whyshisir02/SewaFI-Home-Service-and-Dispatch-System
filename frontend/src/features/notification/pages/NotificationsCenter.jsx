import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  BellRing,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Info,
  LockKeyhole,
  RefreshCw,
  Tag,
  UserCheck,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { useNotificationSocket } from '../hooks/useNotificationSocket';
import { useNotifications } from '../hooks/useNotifications';
import { appToast } from '../../../lib/toast';
import { ROUTES } from '../../../constants/routes.constant';

const FILTERS_BY_ROLE = {
  customer: ['all', 'unread', 'bookings', 'payments', 'system'],
  provider: ['all', 'unread', 'jobs', 'bookings', 'payments', 'system'],
  admin: ['all', 'unread', 'providers', 'bookings', 'system', 'alerts'],
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'unread', label: 'Unread first' },
];

const typeIconMap = {
  BOOKING_CREATED: ClipboardList,
  BOOKING_STATUS_UPDATED: CalendarCheck,
  BOOKING_ACCEPTED: UserCheck,
  BOOKING_CANCELLED: XCircle,
  BOOKING_COMPLETED: CheckCircle2,
  JOB_AVAILABLE: BriefcaseBusiness,
  JOB_ASSIGNED: BriefcaseBusiness,
  PROVIDER_APPROVED: BadgeCheck,
  PROVIDER_REJECTED: AlertTriangle,
  PAYMENT_UPDATED: WalletCards,
  REVIEW_REQUEST: CheckCircle2,
  SECURITY: LockKeyhole,
  OTP: LockKeyhole,
  SYSTEM: Info,
  PROMOTION: Tag,
};

const formatFilterLabel = (filter) => {
  if (filter === 'all') return 'All';
  if (filter === 'unread') return 'Unread';
  if (filter === 'bookings') return 'Bookings';
  if (filter === 'jobs') return 'Jobs';
  if (filter === 'payments') return 'Payments';
  if (filter === 'providers') return 'Providers';
  if (filter === 'alerts') return 'Alerts';
  return 'System';
};

const toEpoch = (value) => {
  const time = new Date(value || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatTime = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
};

const matchesFilter = (notification, filter) => {
  const type = (notification?.type || '').toUpperCase();
  const message = `${notification?.title || ''} ${notification?.message || ''}`.toUpperCase();
  if (filter === 'all') return true;
  if (filter === 'unread') return !notification?.isRead;
  if (filter === 'bookings') return type.includes('BOOKING') || message.includes('BOOKING');
  if (filter === 'jobs') return type.includes('JOB') || message.includes('JOB');
  if (filter === 'payments') return type.includes('PAYMENT') || message.includes('PAYMENT');
  if (filter === 'providers') return type.includes('PROVIDER') || message.includes('PROVIDER');
  if (filter === 'alerts') return type.includes('ALERT') || type.includes('SECURITY');
  return type.includes('SYSTEM') || type.includes('ACCOUNT') || type.includes('SECURITY');
};

const routeByRole = {
  customer: {
    booking: (id) => ROUTES.customer.bookingDetails.replace(':id', id),
    fallback: ROUTES.customer.dashboard,
  },
  provider: {
    booking: (id) => ROUTES.provider.jobDetails.replace(':id', id),
    fallback: ROUTES.provider.dashboard,
  },
  admin: {
    booking: (id) => `/admin/bookings/${id}`,
    fallback: ROUTES.admin.dashboard,
  },
};

const getNotificationLink = (role, notification) => {
  const actionUrl =
    notification?.actionUrl ||
    notification?.link ||
    notification?.data?.actionUrl ||
    notification?.data?.link;
  if (actionUrl && actionUrl.startsWith('/')) return actionUrl;
  const bookingId = notification?.bookingId || notification?.data?.bookingId;
  if (bookingId) return routeByRole[role]?.booking(String(bookingId));
  return null;
};

export function NotificationsCenter({ role = 'customer' }) {
  useNotificationSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState(searchParams.get('q') || '');
  const [markAllSupported, setMarkAllSupported] = useState(true);
  const [deleteSupported, setDeleteSupported] = useState(true);

  const filter = searchParams.get('filter') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      ...(filter !== 'all' ? { status: filter === 'unread' ? 'unread' : filter, type: filter } : {}),
    }),
    [filter, page]
  );

  const {
    notificationsQuery,
    unreadCountQuery,
    markAsReadMutation,
    markAllAsReadMutation,
    deleteNotificationMutation,
  } = useNotifications({ role, filters });

  const backendList = useMemo(() => notificationsQuery.data?.notifications || [], [notificationsQuery.data]);
  const meta = notificationsQuery.data?.meta;
  const filtersForRole = FILTERS_BY_ROLE[role] || FILTERS_BY_ROLE.customer;

  const localUnreadCount = backendList.filter((item) => !item?.isRead).length;
  const unreadCountPayload = unreadCountQuery.data;
  const unreadCount =
    unreadCountPayload?.count ??
    unreadCountPayload?.unreadCount ??
    unreadCountPayload?.totalUnread ??
    (typeof unreadCountPayload === 'number' ? unreadCountPayload : localUnreadCount);

  const filteredNotifications = useMemo(() => {
    const query = localSearch.trim().toLowerCase();
    const filtered = backendList.filter((item) => {
      if (!matchesFilter(item, filter)) return false;
      if (!query) return true;
      const text = `${item?.title || ''} ${item?.message || ''}`.toLowerCase();
      return text.includes(query);
    });

    if (sort === 'oldest') return [...filtered].sort((a, b) => toEpoch(a?.createdAt) - toEpoch(b?.createdAt));
    if (sort === 'unread') return [...filtered].sort((a, b) => Number(Boolean(a?.isRead)) - Number(Boolean(b?.isRead)));
    return [...filtered].sort((a, b) => toEpoch(b?.createdAt) - toEpoch(a?.createdAt));
  }, [backendList, filter, localSearch, sort]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === 'newest') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const onMarkAll = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      appToast.success('All notifications marked as read.');
    } catch (error) {
      if (error?.code === 'NOTIFICATIONS_MARK_ALL_ENDPOINT_MISSING') {
        setMarkAllSupported(false);
        appToast.error('Bulk mark-as-read is unavailable right now.');
        return;
      }
      appToast.error('Unable to mark all notifications as read.');
    }
  };

  const onDelete = async (id) => {
    try {
      await deleteNotificationMutation.mutateAsync(id);
      appToast.success('Notification deleted.');
    } catch (error) {
      if (error?.code === 'NOTIFICATIONS_DELETE_ENDPOINT_MISSING') {
        setDeleteSupported(false);
        appToast.error('Delete action is unavailable right now.');
        return;
      }
      appToast.error('Unable to delete notification.');
    }
  };

  const onMarkRead = async (id) => {
    try {
      await markAsReadMutation.mutateAsync(id);
    } catch (error) {
      if (error?.code === 'NOTIFICATIONS_MARK_READ_ENDPOINT_MISSING') {
        appToast.error('Notification status update is unavailable right now.');
        return;
      }
      appToast.error('Unable to update notification status.');
    }
  };

  const totalCount = meta?.total ?? backendList.length;
  const bookingCount = backendList.filter((item) => matchesFilter(item, 'bookings')).length;
  const systemCount = backendList.filter((item) => matchesFilter(item, 'system')).length;

  const canLoadMore = Boolean(meta?.hasMore || (meta?.totalPages && meta?.page < meta?.totalPages));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Notifications"
        description="Stay updated with booking, job, account, and system activity."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => notificationsQuery.refetch()}
              className="rounded-xl"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {markAllSupported ? (
              <Button
                type="button"
                variant="outline"
                disabled={!unreadCount || markAllAsReadMutation.isPending}
                onClick={onMarkAll}
                className="rounded-xl"
              >
                Mark all as read
              </Button>
            ) : null}
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'All Notifications', value: totalCount },
          { label: 'Unread', value: unreadCount },
          { label: 'Booking Updates', value: bookingCount },
          { label: 'System / Account', value: systemCount },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">{item.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filtersForRole.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setParam('filter', item)}
              className={`h-11 shrink-0 rounded-xl border px-4 text-sm font-semibold transition ${
                filter === item
                  ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary)]/15 text-[var(--sf-secondary)]'
                  : 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-muted)]'
              }`}
            >
              {formatFilterLabel(item)}
              {item === 'unread' && unreadCount ? <span className="ml-2 rounded-full bg-[var(--sf-accent)] px-2 py-0.5 text-xs text-white">{unreadCount}</span> : null}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
          <Input
            label="Search notifications"
            value={localSearch}
            onChange={(event) => {
              setLocalSearch(event.target.value);
              const next = new URLSearchParams(searchParams);
              if (event.target.value.trim()) next.set('q', event.target.value.trim());
              else next.delete('q');
              setSearchParams(next);
            }}
            placeholder="Search notifications..."
          />
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--sf-text-main)]">
            <span>Sort</span>
            <select
              className="h-11 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
              value={sort}
              onChange={(event) => setParam('sort', event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {notificationsQuery.isLoading ? (
        <section className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
          ))}
        </section>
      ) : null}

      {!notificationsQuery.isLoading && notificationsQuery.isError ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <p className="text-sm text-[var(--sf-text-muted)]">Unable to load notifications right now.</p>
          <Button type="button" variant="outline" className="mt-3 rounded-xl" onClick={() => notificationsQuery.refetch()}>
            Retry
          </Button>
        </section>
      ) : null}

      {!notificationsQuery.isLoading && !notificationsQuery.isError && !filteredNotifications.length ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
          <p className="text-base font-semibold text-[var(--sf-text-main)]">
            {filter === 'all' ? 'No notifications yet.' : 'No notifications found for this filter.'}
          </p>
          {filter !== 'all' ? (
            <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => setParam('filter', 'all')}>
              Clear filters
            </Button>
          ) : null}
        </section>
      ) : null}

      {!notificationsQuery.isLoading && !notificationsQuery.isError && filteredNotifications.length ? (
        <section aria-label="Notification list" className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = typeIconMap[(notification?.type || '').toUpperCase()] || Bell;
            const href = getNotificationLink(role, notification);
            const isUnread = !notification?.isRead;
            return (
              <article
                key={notification?.id || `${notification?.createdAt}-${notification?.title}`}
                className={`rounded-2xl border p-4 ${isUnread ? 'border-[var(--sf-secondary)]/30 bg-[var(--sf-secondary)]/8' : 'border-[var(--sf-border)] bg-[var(--sf-surface)]'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sf-surface-soft)] text-[var(--sf-primary)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm ${isUnread ? 'font-bold' : 'font-semibold'} text-[var(--sf-text-main)]`}>{notification?.title || 'Notification'}</p>
                      <span className="rounded-full border border-[var(--sf-border)] px-2 py-0.5 text-[11px] font-semibold text-[var(--sf-text-muted)]">
                        {notification?.type || 'SYSTEM'}
                      </span>
                      <span className="text-xs text-[var(--sf-text-muted)]">{isUnread ? 'Unread' : 'Read'}</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--sf-text-muted)]">{notification?.message || 'No additional details available.'}</p>
                    <p className="mt-2 text-xs text-[var(--sf-text-muted)]">{formatTime(notification?.createdAt)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {isUnread ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-xl"
                          onClick={() => onMarkRead(notification?.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          Mark as read
                        </Button>
                      ) : null}
                      {href ? (
                        <Button as={Link} to={href} variant="outline" className="h-9 rounded-xl">
                          View details
                        </Button>
                      ) : null}
                      {deleteSupported ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-xl"
                          onClick={() => onDelete(notification?.id)}
                          disabled={deleteNotificationMutation.isPending}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {isUnread ? <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[var(--sf-accent)]" aria-label="Unread notification" /> : null}
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {canLoadMore ? (
        <div className="flex justify-center">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => setParam('page', String(page + 1))}>
            Load More
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationsCenter;
