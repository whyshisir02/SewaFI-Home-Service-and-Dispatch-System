import { Link } from 'react-router-dom';
import { ArrowRight, CalendarRange, ClipboardList } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button';
import { Skeleton } from '../../../../components/ui/Feedback/Skeleton';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency } from '../../../../utils/formatCurrency';
import { formatDate } from '../../../../utils/formatDate';
import { getAmount, getBookingDate, getProviderName, getServiceName, sortByRecent } from './dashboardUtils';

const BookingAmount = ({ booking }) => {
  const amount = getAmount(booking);
  if (!amount) return <span>Not available</span>;
  return (
    <span>
      {amount.label === 'Estimated' ? 'Est. ' : ''}
      {formatCurrency(amount.value)}
    </span>
  );
};

export function RecentBookingsTable({ bookings = [], isLoading }) {
  const recentBookings = sortByRecent(bookings).slice(0, 5);

  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
        <Skeleton className="h-8 w-48" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[0_16px_40px_rgba(7,59,115,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Recent activity</p>
          <h2 className="mt-1 text-2xl font-extrabold text-[var(--sf-text-main)]">Recent Bookings</h2>
        </div>
        <Button as={Link} to="/customer/bookings" variant="outline" className="rounded-xl">
          View all bookings
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {!recentBookings.length ? (
        <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-8 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
            <ClipboardList className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-2xl font-extrabold text-[var(--sf-text-main)]">No bookings yet.</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--sf-text-muted)]">
            Your booking history will appear here after you create your first service request.
          </p>
          <Button as={Link} to="/customer/book" className="mt-5 rounded-xl bg-[var(--sf-accent)] text-white hover:bg-[var(--sf-accent)]/90">
            Book your first service
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 hidden overflow-hidden rounded-2xl border border-[var(--sf-border)] lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--sf-surface-soft)] text-xs uppercase tracking-[0.16em] text-[var(--sf-text-muted)]">
                <tr>
                  <th className="px-4 py-4 font-semibold">Service</th>
                  <th className="px-4 py-4 font-semibold">Booking Code</th>
                  <th className="px-4 py-4 font-semibold">Provider</th>
                  <th className="px-4 py-4 font-semibold">Date & Time</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Amount</th>
                  <th className="px-4 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sf-border)]">
                {recentBookings.map((booking) => {
                  const bookingDate = getBookingDate(booking);
                  return (
                    <tr key={booking.id} className="text-[var(--sf-text-muted)]">
                      <td className="px-4 py-4 font-semibold text-[var(--sf-text-main)]">{getServiceName(booking)}</td>
                      <td className="px-4 py-4">{booking.bookingCode || booking.id}</td>
                      <td className="px-4 py-4">{getProviderName(booking) || 'Not assigned yet'}</td>
                      <td className="px-4 py-4">{bookingDate ? formatDate(bookingDate, { includeTime: true }) : 'Not scheduled'}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-4">
                        <BookingAmount booking={booking} />
                      </td>
                      <td className="px-4 py-4">
                        <Link className="font-semibold text-[var(--sf-secondary)] hover:underline" to={`/customer/bookings/${booking.id}`}>
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-3 lg:hidden">
            {recentBookings.map((booking) => {
              const bookingDate = getBookingDate(booking);
              return (
                <article key={booking.id} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-[var(--sf-text-main)]">{getServiceName(booking)}</h3>
                      <p className="mt-1 text-xs text-[var(--sf-text-muted)]">{booking.bookingCode || booking.id}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-[var(--sf-text-muted)]">
                    <p className="flex gap-2">
                      <CalendarRange className="mt-0.5 h-4 w-4 text-[var(--sf-secondary)]" />
                      {bookingDate ? formatDate(bookingDate, { includeTime: true }) : 'Not scheduled'}
                    </p>
                    <p>Provider: {getProviderName(booking) || 'Not assigned yet'}</p>
                    <p>
                      Amount: <BookingAmount booking={booking} />
                    </p>
                  </div>
                  <Button as={Link} to={`/customer/bookings/${booking.id}`} variant="outline" className="mt-4 w-full rounded-xl">
                    View / Track
                  </Button>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default RecentBookingsTable;
