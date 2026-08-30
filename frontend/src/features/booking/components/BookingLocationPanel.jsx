import { Navigation } from 'lucide-react';
import { locationSummary, safeDate } from './trackingUtils';
import { buildBookingAddress } from '../../../utils/bookingLocation';

export function BookingLocationPanel({ booking, trackingLocations, trackingMessage }) {
  const fullAddress = buildBookingAddress(booking);
  const providerLocation = trackingLocations?.PROVIDER;

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm">
      <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Dispatch Location</h2>

      <div className="mt-5 space-y-3 text-sm text-[var(--sf-text-muted)]">
        <p>
          <span className="font-bold text-[var(--sf-text-main)]">Address:</span> {fullAddress || 'Not available'}
        </p>
        <p>
          <span className="font-bold text-[var(--sf-text-main)]">Area:</span> {locationSummary(booking) || 'Not available'}
        </p>
        {booking?.addressLandmark ? (
          <p>
            <span className="font-bold text-[var(--sf-text-main)]">Landmark:</span> {booking.addressLandmark}
          </p>
        ) : null}
        {providerLocation ? (
          <div className="rounded-2xl bg-[var(--sf-secondary-soft)] p-3 text-[var(--sf-secondary)]">
            <p className="flex items-center gap-2 font-bold">
              <Navigation className="h-4 w-4" aria-hidden="true" />
              Provider live location received
            </p>
            {safeDate(providerLocation.updatedAt) ? <p className="mt-1 text-xs">Updated {safeDate(providerLocation.updatedAt)}</p> : null}
          </div>
        ) : (
          <p className="rounded-2xl bg-[var(--sf-bg)] p-3">
            {booking.providerId
              ? trackingMessage || 'Live route is not available yet.'
              : 'Provider route will appear after acceptance if live location is available.'}
          </p>
        )}
      </div>
    </section>
  );
}

export default BookingLocationPanel;
