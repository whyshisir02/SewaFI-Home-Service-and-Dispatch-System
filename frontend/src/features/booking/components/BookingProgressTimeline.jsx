import { CheckCircle2, ClipboardCheck, Hammer, Radar, UserCheck, XCircle } from 'lucide-react';
import { getDisplayStatus, safeDate } from './trackingUtils';

const baseSteps = [
  { key: 'REQUESTED', label: 'Booking Requested', icon: ClipboardCheck },
  { key: 'PROVIDER_SEARCHING', label: 'Searching Providers', icon: Radar },
  { key: 'ACCEPTED', label: 'Provider Accepted', icon: UserCheck },
  { key: 'IN_PROGRESS', label: 'Work In Progress', icon: Hammer },
  { key: 'AWAITING_CONFIRMATION', label: 'Awaiting Customer Confirmation', icon: Radar },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
];

const statusIndex = {
  PROVIDER_SEARCHING: 1,
  NEW_REQUEST: 1,
  PENDING: 1,
  ACCEPTED: 2,
  IN_PROGRESS: 3,
  AWAITING_CONFIRMATION: 4,
  COMPLETED: 5,
  PAYMENT_DISPUTED: 4,
};

export function BookingProgressTimeline({ booking }) {
  const displayStatus = getDisplayStatus(booking, { audience: 'customer' });
  const isExpired = displayStatus === 'EXPIRED';
  const isCancelled = displayStatus === 'CANCELLED' || isExpired;
  const isDisputed = displayStatus === 'PAYMENT_DISPUTED';
  const activeIndex = statusIndex[displayStatus] ?? 0;
  const steps = isCancelled
    ? [...baseSteps.slice(0, 1), { key: isExpired ? 'EXPIRED' : 'CANCELLED', label: isExpired ? 'Expired' : 'Cancelled', icon: XCircle }]
    : isDisputed
      ? [...baseSteps.slice(0, 5), { key: 'PAYMENT_DISPUTED', label: 'Payment Disputed', icon: XCircle }]
      : baseSteps;

  const times = {
    REQUESTED: booking.createdAt,
    ACCEPTED: booking.providerId ? booking.updatedAt : null,
    IN_PROGRESS: booking.startedAt,
    AWAITING_CONFIRMATION: booking.providerProposedAmount || booking.finalAmount ? booking.updatedAt : null,
    COMPLETED: booking.completedAt,
    CANCELLED: booking.cancelledAt,
    EXPIRED: booking.cancelledAt,
    PAYMENT_DISPUTED: booking.updatedAt,
  };

  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Booking Progress</h2>
      <ol className="mt-6 grid gap-4 lg:grid-cols-5">
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          const completed = isCancelled ? index === 0 : index < activeIndex;
          const active = isCancelled ? step.key === 'CANCELLED' : index === activeIndex;
          const pending = !completed && !active;

          return (
            <li key={step.key} className="relative flex gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-4 lg:block">
              <span
                className={
                  active && step.key === 'CANCELLED'
                    ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--sf-danger)] text-white'
                    : completed || active
                      ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--sf-secondary)] text-white'
                      : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--sf-surface-soft)] text-[var(--sf-text-soft)]'
                }
              >
                <IconComponent className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="lg:mt-4">
                <p className={pending ? 'font-bold text-[var(--sf-text-muted)]' : 'font-bold text-[var(--sf-text-main)]'}>{step.label}</p>
                {safeDate(times[step.key]) ? <p className="mt-1 text-xs text-[var(--sf-text-soft)]">{safeDate(times[step.key])}</p> : null}
                {active ? <p className="mt-2 text-xs font-bold text-[var(--sf-secondary)]">Current step</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default BookingProgressTimeline;
