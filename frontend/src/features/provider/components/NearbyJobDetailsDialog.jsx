import { Button } from '../../../components/ui/Button/Button';
import { Modal } from '../../../components/ui/Overlay/Modal';
import { Drawer } from '../../../components/ui/Overlay/Drawer';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { BookingStatusBadge } from '../../booking/components/BookingStatusBadge';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { formatDate } from '../../../utils/formatDate';
import { formatCurrency } from '../../../utils/formatCurrency';

const getServiceName = (job) => job?.service?.name || job?.serviceName || 'Service request';
const getArea = (job) =>
  job?.areaLabel ||
  job?.location?.area ||
  [job?.municipality, job?.district, job?.province].filter(Boolean).join(', ') ||
  'Customer area hidden until acceptance';

const formatDistance = (distanceKm) => {
  if (distanceKm == null || Number.isNaN(Number(distanceKm))) return null;
  return `${Number(distanceKm).toFixed(1)} km`;
};

export function NearbyJobDetailsDialog({
  job,
  open,
  onClose,
  onAccept,
  onDecline,
  accepting = false,
  declining = false,
}) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const distance = formatDistance(job?.distanceKm);
  const amount = job?.estimatedPrice ?? job?.totalPrice;
  const Container = isDesktop ? Modal : Drawer;

  if (!job) return null;

  return (
    <Container open={open} onClose={onClose} title={getServiceName(job)}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <BookingStatusBadge booking={job} audience="provider" surface="nearby" />
          {job?.dispatchState ? <StatusBadge status={job.dispatchState} /> : null}
        </div>

        <div className="space-y-2 text-sm text-[var(--sf-text-muted)]">
          <p><span className="font-semibold text-[var(--sf-text-main)]">Booking:</span> #{job?.bookingCode || job?.id}</p>
          <p><span className="font-semibold text-[var(--sf-text-main)]">Area:</span> {getArea(job)}</p>
          <p>
            <span className="font-semibold text-[var(--sf-text-main)]">Preferred time:</span>{' '}
            {job?.preferredDate || job?.scheduledAt ? formatDate(job?.preferredDate || job?.scheduledAt, { includeTime: Boolean(job?.preferredTimeSlot) }) : 'Not specified'}
            {job?.preferredTimeSlot ? ` • ${job.preferredTimeSlot}` : ''}
          </p>
          {distance ? <p><span className="font-semibold text-[var(--sf-text-main)]">Distance:</span> {distance}</p> : null}
          {amount != null ? <p><span className="font-semibold text-[var(--sf-text-main)]">Estimated price:</span> {formatCurrency(amount)}</p> : null}
          {job?.expiresAt ? <p><span className="font-semibold text-[var(--sf-text-main)]">Expires:</span> {formatDate(job.expiresAt, { includeTime: true })}</p> : null}
          {job?.description ? <p><span className="font-semibold text-[var(--sf-text-main)]">Description:</span> {job.description}</p> : null}
          {job?.specialInstructions ? <p><span className="font-semibold text-[var(--sf-text-main)]">Special instructions:</span> {job.specialInstructions}</p> : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onClose}>
            Close
          </Button>
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
    </Container>
  );
}

export default NearbyJobDetailsDialog;
