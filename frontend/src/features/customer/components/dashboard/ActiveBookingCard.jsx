import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, MapPin, Radar, UserCheck } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button';
import { Skeleton } from '../../../../components/ui/Feedback/Skeleton';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency } from '../../../../utils/formatCurrency';
import { formatDate } from '../../../../utils/formatDate';
import {
  getAmount,
  getBookingDate,
  getLocationSummary,
  getProviderName,
  getService,
  getServiceName,
} from './dashboardUtils';

export function ActiveBookingCard({ booking, isLoading }) {
  const service = getService(booking);
  const serviceImage = service?.imageUrl || service?.image || '';
  const [imageFailed, setImageFailed] = useState(false);

  if (isLoading) return <Skeleton className="h-[360px] rounded-[28px]" />;

  if (!booking) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-8 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
          <Radar className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-2xl font-extrabold text-[var(--sf-text-main)]">No active bookings right now.</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--sf-text-muted)]">
          When you book a service, live status and provider matching details will appear here.
        </p>
        <Button as={Link} to="/customer/book" className="mt-5 rounded-xl bg-[var(--sf-accent)] text-white hover:bg-[var(--sf-accent)]/90">
          Book a Service
        </Button>
      </div>
    );
  }

  const hasServiceImage = Boolean(serviceImage) && !imageFailed;
  const amount = getAmount(booking);
  const providerName = getProviderName(booking);
  const bookingDate = getBookingDate(booking);

  return (
    <article className="overflow-hidden rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-[var(--sf-shadow)]">
      <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
        <div className="min-h-[220px] bg-[linear-gradient(135deg,var(--sf-primary-soft),var(--sf-secondary-soft))] p-6">
          {hasServiceImage ? (
            <img
              key={serviceImage}
              src={serviceImage}
              alt={service.name || 'Booked service'}
              loading="lazy"
              decoding="async"
              className="h-full min-h-[180px] w-full rounded-2xl object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full min-h-[180px] flex-col justify-between rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]/80 p-5">
              <Radar className="h-10 w-10 text-[var(--sf-secondary)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sf-text-muted)]">Automatic dispatch</p>
                <p className="mt-2 text-lg font-bold text-[var(--sf-text-main)]">Provider matching</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sf-text-muted)]">
                {booking.bookingCode || 'Active booking'}
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">{getServiceName(booking)}</h2>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <div className="grid gap-3 text-sm text-[var(--sf-text-muted)] md:grid-cols-2">
            <p className="flex gap-2">
              <UserCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--sf-secondary)]" />
              <span>{providerName ? `Provider: ${providerName}` : 'Waiting for provider match'}</span>
            </p>
            {bookingDate ? (
              <p className="flex gap-2">
                <CalendarClock className="mt-1 h-4 w-4 shrink-0 text-[var(--sf-secondary)]" />
                <span>{formatDate(bookingDate, { includeTime: true })}</span>
              </p>
            ) : null}
            <p className="flex gap-2 md:col-span-2">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-[var(--sf-secondary)]" />
              <span>{getLocationSummary(booking)}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--sf-text-main)]">Dispatch status</p>
            <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">
              {providerName
                ? 'A provider has been assigned to this booking.'
                : 'SewaFi is checking eligible nearby providers based on your service and address.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--sf-text-muted)]">
              Amount:{' '}
              <span className="font-semibold text-[var(--sf-text-main)]">
                {amount ? `${amount.label} ${formatCurrency(amount.value)}` : 'Not available'}
              </span>
            </p>
            <Button as={Link} to={`/customer/bookings/${booking.id}`} className="rounded-xl">
              Track Booking
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ActiveBookingCard;
