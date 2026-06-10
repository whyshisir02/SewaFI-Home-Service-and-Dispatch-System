import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock3, Search, XCircle } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { ROUTES } from '../../../constants/routes.constant';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { getCustomerCancellationPolicy } from '../../../utils/bookingCancellation';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Input/Select';
import { ConfirmDialog } from '../../../components/ui/Overlay/ConfirmDialog';
import { Container } from '../../../components/ui/Layout/Container';
import { BookingStatusBadge } from '../../booking/components/BookingStatusBadge';
import { useCancelBooking, useCustomerBookings } from '../../booking/hooks/useCustomerBookings';
import { deriveBookingStatusForDisplay } from '../../../constants/booking-status.constant';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

const ACTIVE_STATUSES = new Set(['PENDING', 'ACCEPTED', 'IN_PROGRESS']);

const toEpoch = (value) => {
  const time = new Date(value || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const matchesDateRange = (booking, range) => {
  if (range === 'all') return true;
  const value = booking?.scheduledTime || booking?.scheduledAt || booking?.preferredDate || booking?.createdAt;
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  if (range === 'today') {
    return date.toDateString() === now.toDateString();
  }

  if (range === 'week') {
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    return date >= oneWeekAgo && date <= now;
  }

  if (range === 'month') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  return true;
};

const getDisplayAmount = (booking) =>
  booking?.finalAmount ??
  booking?.providerProposedAmount ??
  booking?.estimatedAmount ??
  booking?.totalPrice ??
  booking?.basePrice ??
  booking?.finalPrice ??
  booking?.estimatedPrice ??
  null;

function CustomerBookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cancelTarget, setCancelTarget] = useState(null);

  const status = searchParams.get('status') || 'ALL';
  const search = searchParams.get('search') || '';
  const range = searchParams.get('range') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  const apiFilters = useMemo(
    () => ({
      page,
      limit: 10,
      ...(status !== 'ALL' ? { status } : {}),
      ...(search ? { search } : {}),
      ...(sort === 'oldest' ? { sort: 'oldest' } : { sort: 'newest' }),
    }),
    [page, search, sort, status]
  );

  const bookingsQuery = useCustomerBookings(apiFilters);
  const cancelMutation = useCancelBooking();
  const bookings = useMemo(() => bookingsQuery.data?.bookings || [], [bookingsQuery.data]);
  const meta = bookingsQuery.data?.meta;

  const normalizedSearch = search.trim().toLowerCase();
  const filteredBookings = useMemo(() => {
    let output = bookings.filter((booking) => {
      const text = `${booking?.bookingCode || ''} ${booking?.service?.name || ''} ${booking?.provider?.name || ''}`.toLowerCase();
      const statusMatch =
        status === 'ALL' ? true : deriveBookingStatusForDisplay(booking) === status;
      return statusMatch && (!normalizedSearch || text.includes(normalizedSearch)) && matchesDateRange(booking, range);
    });

    output = [...output].sort((a, b) => {
      const left = toEpoch(a?.createdAt || a?.scheduledTime || a?.scheduledAt || a?.preferredDate);
      const right = toEpoch(b?.createdAt || b?.scheduledTime || b?.scheduledAt || b?.preferredDate);
      return sort === 'oldest' ? left - right : right - left;
    });

    return output;
  }, [bookings, normalizedSearch, range, sort, status]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter((item) => ACTIVE_STATUSES.has(deriveBookingStatusForDisplay(item))).length;
    const completed = bookings.filter((item) => deriveBookingStatusForDisplay(item) === 'COMPLETED').length;
    const cancelled = bookings.filter((item) => deriveBookingStatusForDisplay(item) === 'CANCELLED').length;
    return { total, active, completed, cancelled };
  }, [bookings]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'ALL' || value === 'all' || value === 'newest') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());

  const onConfirmCancel = async () => {
    if (!cancelTarget?.id) return;
    try {
      await cancelMutation.mutateAsync({ id: cancelTarget.id });
      appToast.success('Booking cancelled successfully.');
      setCancelTarget(null);
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to cancel booking right now.'));
    }
  };

  const canLoadMore = Boolean(meta?.hasMore || (meta?.totalPages && meta?.page < meta?.totalPages));

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Bookings"
        title="My Bookings"
        description="View, track, and manage your service bookings."
        actions={
          <Button as={Link} to="/customer/book" className="rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95">
            Book a Service
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Bookings', value: stats.total, icon: CalendarDays },
          { label: 'Active', value: stats.active, icon: Clock3 },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2 },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
              <div className="flex items-center gap-2 text-[var(--sf-primary)]">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">{item.label}</p>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">{item.value}</p>
              <p className="text-xs text-[var(--sf-text-muted)]">From loaded bookings</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <Input
            label="Search"
            value={search}
            onChange={(event) => setParam('search', event.target.value.trim())}
            placeholder="Search by booking code, service, or provider..."
          />
          <Select label="Status" value={status} onChange={(e) => setParam('status', e.target.value)} options={STATUS_OPTIONS} placeholder="All statuses" />
          <Select label="Date range" value={range} onChange={(e) => setParam('range', e.target.value)} options={DATE_RANGE_OPTIONS} placeholder="All time" />
          <Select label="Sort" value={sort} onChange={(e) => setParam('sort', e.target.value)} options={SORT_OPTIONS} placeholder="Newest first" />
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={clearFilters} className="h-11 rounded-xl">
              <Search className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </section>

      {bookingsQuery.isLoading ? (
        <section className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
          ))}
        </section>
      ) : null}

      {!bookingsQuery.isLoading && bookingsQuery.isError ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <p className="text-sm text-[var(--sf-text-muted)]">Unable to load bookings right now.</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" onClick={() => bookingsQuery.refetch()}>
              Retry
            </Button>
            <Button as={Link} to="/customer/book" variant="outline">
              Book a Service
            </Button>
          </div>
        </section>
      ) : null}

      {!bookingsQuery.isLoading && !bookingsQuery.isError && !filteredBookings.length ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">{search || status !== 'ALL' || range !== 'all' ? 'No bookings found' : 'No bookings yet'}</p>
          <p className="mt-1 text-sm text-[var(--sf-text-muted)]">
            {search || status !== 'ALL' || range !== 'all'
              ? 'Try changing your filters or search term.'
              : 'Book your first service and track it from your dashboard.'}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {search || status !== 'ALL' || range !== 'all' ? (
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button as={Link} to="/customer/book" className="bg-[var(--sf-accent)] text-white hover:brightness-95">
                Book a Service
              </Button>
            )}
          </div>
        </section>
      ) : null}

      {!bookingsQuery.isLoading && !bookingsQuery.isError && filteredBookings.length ? (
        <>
          <section className="hidden overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--sf-surface-soft)] text-[var(--sf-text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Booking</th>
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 font-semibold">Date & Time</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const trackPath = ROUTES.customer.bookingDetails.replace(':id', booking.id);
                  const amount = getDisplayAmount(booking);
                  return (
                    <tr key={booking.id} className="border-t border-[var(--sf-border)]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--sf-primary)]">{booking?.bookingCode || `#${String(booking?.id || '').slice(0, 8)}`}</p>
                        <p className="text-xs text-[var(--sf-text-muted)]">{formatDate(booking?.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">{booking?.service?.name || 'Service booking'}</td>
                      <td className="px-4 py-3">{booking?.provider?.name || 'Not assigned yet'}</td>
                      <td className="px-4 py-3">{formatDate(booking?.scheduledTime || booking?.scheduledAt || booking?.preferredDate, { includeTime: true })}</td>
                      <td className="px-4 py-3">
                        <BookingStatusBadge booking={booking} />
                      </td>
                      <td className="px-4 py-3">{amount !== undefined && amount !== null ? formatCurrency(amount) : 'Not available'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button as={Link} to={trackPath} variant="outline" className="h-9 rounded-xl">
                            Track
                          </Button>
                          {getCustomerCancellationPolicy(booking).canCancel ? (
                            <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setCancelTarget(booking)}>
                              Cancel
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="space-y-3 lg:hidden">
            {filteredBookings.map((booking) => {
              const trackPath = ROUTES.customer.bookingDetails.replace(':id', booking.id);
              const amount = getDisplayAmount(booking);
              return (
                <article key={booking.id} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">{booking?.bookingCode || `#${String(booking?.id || '').slice(0, 8)}`}</p>
                      <p className="mt-1 text-base font-bold text-[var(--sf-text-main)]">{booking?.service?.name || 'Service booking'}</p>
                    </div>
                    <BookingStatusBadge booking={booking} />
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-[var(--sf-text-muted)]">
                    <p>Provider: {booking?.provider?.name || 'Not assigned yet'}</p>
                    <p>Date: {formatDate(booking?.scheduledTime || booking?.scheduledAt || booking?.preferredDate, { includeTime: true })}</p>
                    <p>Amount: {amount !== undefined && amount !== null ? formatCurrency(amount) : 'Not available'}</p>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <Button as={Link} to={trackPath} variant="outline" className="h-10 rounded-xl">
                      Track Booking
                    </Button>
                    {getCustomerCancellationPolicy(booking).canCancel ? (
                      <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setCancelTarget(booking)}>
                        Cancel Booking
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        </>
      ) : null}

      {canLoadMore ? (
        <div className="flex justify-center">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => setParam('page', String(page + 1))}>
            Load More
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={onConfirmCancel}
        title="Cancel Booking?"
        description={getCustomerCancellationPolicy(cancelTarget).confirmDescription || 'Are you sure you want to cancel this booking?'}
        confirmLabel={cancelMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
        confirmLoading={cancelMutation.isPending}
      />
    </Container>
  );
}

export default CustomerBookings;
