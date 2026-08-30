import { CalendarClock, FileText, MapPin, Wrench } from 'lucide-react';
import { locationSummary, safeDate } from './trackingUtils';

export function BookingServiceDetails({ booking }) {
  const rows = [
    { label: 'Service', value: booking.service?.name || booking.serviceId, icon: Wrench },
    { label: 'Category', value: booking.service?.category?.name, icon: Wrench },
    { label: 'Preferred Date & Time', value: safeDate(booking.scheduledTime), icon: CalendarClock },
    { label: 'Address', value: booking.address, icon: MapPin },
    { label: 'Area', value: locationSummary(booking), icon: MapPin },
    { label: 'Booking Notes', value: booking.notes, icon: FileText },
  ].filter((row) => row.value);

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm">
      <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Service Details</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => {
          const IconComponent = row.icon;

          return (
            <div key={row.label} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-4">
              <IconComponent className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--sf-text-soft)]">{row.label}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-[var(--sf-text-main)]">{row.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default BookingServiceDetails;
