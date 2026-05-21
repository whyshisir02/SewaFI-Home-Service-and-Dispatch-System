import { CalendarClock, Hash, MapPin, RefreshCw, Wrench } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { getStatusMeta, locationSummary, safeDate } from './trackingUtils';

export function BookingStatusCard({ booking, onRefresh, refreshing }) {
  const meta = getStatusMeta(booking);

  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[var(--sf-shadow)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--sf-secondary)]">Booking status</p>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-[var(--sf-text-main)] sm:text-3xl">
            {booking.service?.name || 'Service booking'}
          </h2>
          <div className="mt-5 grid gap-3 text-sm text-[var(--sf-text-muted)] sm:grid-cols-2">
            <Info icon={Hash} label="Booking Number" value={booking.bookingCode || booking.id} />
            <Info icon={CalendarClock} label="Created" value={safeDate(booking.createdAt) || 'Not available'} />
            <Info icon={Wrench} label="Service" value={booking.service?.name || booking.serviceId || 'Not available'} />
            <Info icon={MapPin} label="Location" value={locationSummary(booking) || booking.address || 'Not available'} />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-4 lg:w-80">
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-extrabold ${meta.tone}`}>{meta.label}</span>
          <p className="mt-3 text-sm leading-6 text-[var(--sf-text-muted)]">{meta.explanation}</p>
          <Button type="button" variant="outline" onClick={onRefresh} loading={refreshing} className="mt-4 w-full rounded-xl">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>
    </section>
  );
}

function Info({ icon, label, value }) {
  const IconComponent = icon;

  return (
    <div className="flex gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-3">
      <IconComponent className="mt-0.5 h-4 w-4 shrink-0 text-[var(--sf-secondary)]" aria-hidden="true" />
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sf-text-soft)]">{label}</p>
        <p className="mt-1 font-semibold text-[var(--sf-text-main)]">{value}</p>
      </div>
    </div>
  );
}

export default BookingStatusCard;
