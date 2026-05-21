import { CalendarClock, MapPin, Navigation, ReceiptText } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { getAmount, getJobDate, getLocationSummary, getServiceName } from './providerDashboardUtils';

export function NearbyJobCard({ job, onAccept, accepting }) {
  const amount = getAmount(job);
  const jobDate = getJobDate(job);

  return (
    <article className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[0_16px_40px_rgba(7,59,115,0.08)] transition hover:-translate-y-1 hover:border-[var(--sf-secondary)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sf-text-muted)]">{job.bookingCode || 'Nearby request'}</p>
          <h3 className="mt-2 text-xl font-extrabold text-[var(--sf-text-main)]">{getServiceName(job)}</h3>
        </div>
        <StatusBadge status={job.dispatchPhase || job.dispatchState || job.status} />
      </div>

      {job.description || job.notes ? <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--sf-text-muted)]">{job.description || job.notes}</p> : null}

      <div className="mt-5 grid gap-3 text-sm text-[var(--sf-text-muted)]">
        <p className="flex gap-2">
          <MapPin className="mt-1 h-4 w-4 shrink-0 text-[var(--sf-secondary)]" />
          <span>{getLocationSummary(job)}</span>
        </p>
        {job.distanceKm != null ? (
          <p className="flex gap-2">
            <Navigation className="mt-1 h-4 w-4 shrink-0 text-[var(--sf-secondary)]" />
            <span>{job.distanceKm} km away</span>
          </p>
        ) : null}
        {jobDate ? (
          <p className="flex gap-2">
            <CalendarClock className="mt-1 h-4 w-4 shrink-0 text-[var(--sf-secondary)]" />
            <span>{formatDate(jobDate, { includeTime: true })}</span>
          </p>
        ) : null}
        <p className="flex gap-2">
          <ReceiptText className="mt-1 h-4 w-4 shrink-0 text-[var(--sf-secondary)]" />
          <span>{amount ? `${amount.label} ${formatCurrency(amount.value)}` : 'Amount not available'}</span>
        </p>
      </div>

      <Button
        type="button"
        className="mt-5 h-12 w-full rounded-xl bg-[var(--sf-accent)] text-white hover:bg-[var(--sf-accent)]/90"
        loading={accepting}
        onClick={() => onAccept(job.id)}
      >
        {accepting ? 'Accepting...' : 'Accept Job'}
      </Button>
    </article>
  );
}

export default NearbyJobCard;
