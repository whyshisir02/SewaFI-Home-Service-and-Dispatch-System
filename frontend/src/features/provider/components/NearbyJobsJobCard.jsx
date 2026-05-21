import { Clock3, MapPin } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { BookingStatusBadge } from '../../booking/components/BookingStatusBadge';
import { formatDate } from '../../../utils/formatDate';
import { formatCurrency } from '../../../utils/formatCurrency';

const formatDistance = (distanceKm) => {
  if (distanceKm == null || Number.isNaN(Number(distanceKm))) return null;
  return `${Number(distanceKm).toFixed(1)} km`;
};

const getServiceName = (job) => job?.service?.name || job?.serviceName || 'Service request';
const getArea = (job) =>
  job?.areaLabel ||
  job?.location?.area ||
  [job?.municipality, job?.district, job?.province].filter(Boolean).join(', ') ||
  'Customer area hidden until acceptance';

const formatAmount = (job) => {
  if (job?.estimatedPrice == null && job?.totalPrice == null) return null;
  const amount = job?.estimatedPrice ?? job?.totalPrice;
  return formatCurrency(amount);
};

export function NearbyJobsJobCard({
  job,
  onViewDetails,
  onAccept,
  onDecline,
  accepting = false,
  declining = false,
}) {
  const distance = formatDistance(job?.distanceKm);
  const amount = formatAmount(job);

  return (
    <article className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[var(--sf-shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-[var(--sf-text-main)]">{getServiceName(job)}</p>
          <p className="mt-1 text-sm text-[var(--sf-text-muted)]">#{job?.bookingCode || job?.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <BookingStatusBadge booking={job} audience="provider" surface="nearby" />
          {job?.dispatchState ? <StatusBadge status={job.dispatchState} /> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-[var(--sf-text-muted)]">
        <p className="inline-flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {getArea(job)}
        </p>
        <p className="inline-flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          {job?.preferredDate || job?.scheduledAt ? formatDate(job?.preferredDate || job?.scheduledAt, { includeTime: Boolean(job?.preferredTimeSlot) }) : formatDate(job?.createdAt)}
          {job?.preferredTimeSlot ? ` • ${job.preferredTimeSlot}` : ''}
        </p>
        {distance ? <p>Distance: {distance}</p> : null}
        {amount ? <p>Estimated price: {amount}</p> : null}
      </div>

      {job?.description ? <p className="mt-4 line-clamp-2 text-sm text-[var(--sf-text-muted)]">{job.description}</p> : null}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => onViewDetails?.(job)}>
          View Details
        </Button>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            className="h-11 rounded-xl bg-[var(--sf-accent)] text-white hover:bg-[var(--sf-accent)]/90"
            onClick={() => onAccept?.(job)}
            loading={accepting}
            disabled={accepting || declining}
          >
            Accept
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            onClick={() => onDecline?.(job)}
            loading={declining}
            disabled={accepting || declining}
          >
            Decline
          </Button>
        </div>
      </div>
    </article>
  );
}

export default NearbyJobsJobCard;
