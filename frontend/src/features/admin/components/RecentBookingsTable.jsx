import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, ClipboardList } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { getBookingAmount, getBookingDate, sortByRecent } from './adminDashboardUtils';

const Amount = ({ booking }) => {
  const amount = getBookingAmount(booking);
  if (!amount) return <span>Not available</span>;
  return <span>{amount.label === 'Estimated' ? 'Est. ' : ''}{formatCurrency(amount.value)}</span>;
};

export function RecentBookingsTable({ bookings = [], isLoading, isError, onRetry }) {
  const recentBookings = sortByRecent(bookings).slice(0, 5);

  return (
    <section className="rounded-3xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[0_12px_30px_rgba(7,59,115,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Operations</p>
          <h2 className="mt-1 text-xl font-extrabold text-[var(--sf-text-main)] sm:text-2xl">Recent Bookings</h2>
        </div>
        <Button as={Link} to="/admin/bookings" variant="outline" className="rounded-xl">
          View all bookings
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load recent bookings.</p>
          <button type="button" className="mt-3 text-sm font-semibold text-[var(--sf-secondary)]" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && !recentBookings.length ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-6 text-center">
          <ClipboardList className="h-8 w-8 text-[var(--sf-secondary)]" aria-hidden="true" />
          <h3 className="mt-3 text-xl font-extrabold text-[var(--sf-text-main)]">No recent bookings found.</h3>
        </div>
      ) : null}

      {!isLoading && !isError && recentBookings.length ? (
        <>
          <div className="mt-6 hidden overflow-hidden rounded-2xl border border-[var(--sf-border)] lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--sf-surface-soft)] text-xs uppercase tracking-[0.16em] text-[var(--sf-text-muted)]">
                <tr>
                  <th className="px-4 py-4 font-semibold">Booking Code</th>
                  <th className="px-4 py-4 font-semibold">Service</th>
                  <th className="px-4 py-4 font-semibold">Customer</th>
                  <th className="px-4 py-4 font-semibold">Provider</th>
                  <th className="px-4 py-4 font-semibold">Date / Time</th>
                  <th className="px-4 py-4 font-semibold">Amount</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sf-border)]">
                {recentBookings.map((booking) => {
                  const date = getBookingDate(booking);
                  return (
                    <tr key={booking.id} className="text-[var(--sf-text-muted)]">
                      <td className="px-4 py-4">{booking.bookingCode || booking.id}</td>
                      <td className="px-4 py-4 font-semibold text-[var(--sf-text-main)]">{booking.service?.name || 'Service booking'}</td>
                      <td className="px-4 py-4">{booking.customer?.name || 'Customer'}</td>
                      <td className="px-4 py-4">{booking.provider?.name || 'Not assigned'}</td>
                      <td className="px-4 py-4">{date ? formatDate(date, { includeTime: true }) : 'Not scheduled'}</td>
                      <td className="px-4 py-4"><Amount booking={booking} /></td>
                      <td className="px-4 py-4"><StatusBadge status={booking.status} /></td>
                      <td className="px-4 py-4">
                        <Link className="font-semibold text-[var(--sf-secondary)] hover:underline" to="/admin/bookings">
                          View
                        </Link>
                        {/* TODO: Link to /admin/bookings/:id when an admin booking detail route exists. */}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-3 lg:hidden">
            {recentBookings.map((booking) => {
              const date = getBookingDate(booking);
              return (
                <article key={booking.id} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-[var(--sf-text-main)]">{booking.service?.name || 'Service booking'}</h3>
                      <p className="mt-1 text-xs text-[var(--sf-text-muted)]">{booking.bookingCode || booking.id}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-[var(--sf-text-muted)]">
                    <p className="flex gap-2">
                      <CalendarClock className="mt-0.5 h-4 w-4 text-[var(--sf-secondary)]" />
                      {date ? formatDate(date, { includeTime: true }) : 'Not scheduled'}
                    </p>
                    <p>Customer: {booking.customer?.name || 'Customer'}</p>
                    <p>Provider: {booking.provider?.name || 'Not assigned'}</p>
                    <p>Amount: <Amount booking={booking} /></p>
                  </div>
                  <Button as={Link} to="/admin/bookings" variant="outline" className="mt-4 w-full rounded-xl">
                    View Booking
                  </Button>
                </article>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}

export default RecentBookingsTable;
