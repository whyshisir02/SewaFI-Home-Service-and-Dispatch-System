import { MapPin, Navigation } from 'lucide-react';
import { MapPreview } from '../common/MapPreview';
import { locationSummary, safeDate } from './trackingUtils';

export function BookingLocationPanel({ booking, trackingLocations, trackingMessage }) {
  const mapLatitude = booking?.addressLatitude ?? booking?.latitude;
  const mapLongitude = booking?.addressLongitude ?? booking?.longitude;
  const hasCustomerCoordinates = Number.isFinite(Number(mapLatitude)) && Number.isFinite(Number(mapLongitude));
  const providerLocation = trackingLocations?.PROVIDER;
  const mapValue = hasCustomerCoordinates ? { latitude: Number(mapLatitude), longitude: Number(mapLongitude) } : booking;

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm">
      <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Dispatch Location</h2>
      <div className="mt-5">
        {hasCustomerCoordinates ? (
          <MapPreview value={mapValue} action={null} height="280px" />
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--sf-border)] bg-[var(--sf-bg)] p-5">
            <MapPin className="h-8 w-8 text-[var(--sf-secondary)]" aria-hidden="true" />
            <p className="mt-3 font-bold text-[var(--sf-text-main)]">{booking.address || locationSummary(booking) || 'Location unavailable'}</p>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-3 text-sm text-[var(--sf-text-muted)]">
        <p>
          <span className="font-bold text-[var(--sf-text-main)]">Address:</span> {booking.address || 'Not available'}
        </p>
        <p>
          <span className="font-bold text-[var(--sf-text-main)]">Area:</span> {locationSummary(booking) || 'Not available'}
        </p>
        {hasCustomerCoordinates ? (
          <p className="rounded-2xl bg-[var(--sf-bg)] p-3">
            This map shows the service location you submitted for provider dispatch and tracking.
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
