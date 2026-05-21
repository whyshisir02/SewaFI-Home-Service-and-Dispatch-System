import { Bell, CheckCircle2, Clock } from 'lucide-react';
import { safeDate } from './trackingUtils';

const timelineFromBooking = (booking) =>
  [
    booking.createdAt ? { id: 'created', status: 'Booking requested', message: 'Your booking request was created.', createdAt: booking.createdAt } : null,
    booking.providerId ? { id: 'accepted', status: 'Provider accepted', message: 'A provider accepted your booking.', createdAt: booking.updatedAt } : null,
    booking.startedAt ? { id: 'started', status: 'Work in progress', message: 'The provider started work.', createdAt: booking.startedAt } : null,
    booking.completedAt ? { id: 'completed', status: 'Completed', message: 'Your service was completed.', createdAt: booking.completedAt } : null,
    booking.cancelledAt ? { id: 'cancelled', status: 'Cancelled', message: booking.cancelReason || 'This booking was cancelled.', createdAt: booking.cancelledAt } : null,
  ].filter(Boolean);

export function LiveUpdatesPanel({ booking, socketConnected }) {
  const updates = booking.statusHistory || booking.timeline || timelineFromBooking(booking);

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Live Updates</h2>
        <span className={socketConnected ? 'rounded-full bg-[var(--sf-secondary-soft)] px-3 py-1 text-xs font-bold text-[var(--sf-secondary)]' : 'rounded-full bg-[var(--sf-bg)] px-3 py-1 text-xs font-bold text-[var(--sf-text-muted)]'}>
          {socketConnected ? 'Live' : 'Reconnecting...'}
        </span>
      </div>

      {updates.length ? (
        <ol className="mt-5 space-y-3">
          {updates.map((update) => (
            <li key={update.id || `${update.status}-${update.createdAt}`} className="flex gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-bold text-[var(--sf-text-main)]">{update.status || update.label}</p>
                {update.message || update.description ? <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">{update.message || update.description}</p> : null}
                {safeDate(update.createdAt || update.date) ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--sf-text-soft)]">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {safeDate(update.createdAt || update.date)}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--sf-border)] bg-[var(--sf-bg)] p-5 text-center">
          <Bell className="mx-auto h-8 w-8 text-[var(--sf-secondary)]" aria-hidden="true" />
          <p className="mt-3 text-sm leading-6 text-[var(--sf-text-muted)]">
            No detailed updates yet. Updates will appear as your booking progresses.
          </p>
        </div>
      )}
    </section>
  );
}

export default LiveUpdatesPanel;
