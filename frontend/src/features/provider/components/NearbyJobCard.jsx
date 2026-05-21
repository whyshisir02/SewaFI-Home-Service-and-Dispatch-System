import { Button } from '../../../components/ui/Button/Button';
import { Card } from '../../../components/ui/Layout/Card';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function NearbyJobCard({ booking, onAccept, onReject, loading }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{booking.service?.name || 'Service request'}</p>
          <p className="text-sm text-muted">{booking.areaLabel || booking.municipality || booking.district || 'Customer area hidden until acceptance'}</p>
        </div>
        <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">Expires soon</span>
      </div>
      <div className="grid gap-2 text-sm text-muted">
        <p>Scheduled: {formatDate(booking.scheduledTime, { includeTime: true })}</p>
        <p>Estimated price: {formatCurrency(booking.totalPrice || booking.service?.basePrice || 0)}</p>
        <p>Distance: {booking.distanceText || 'Within your dispatch area'}</p>
      </div>
      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => onAccept?.(booking.id)} loading={loading}>
          Accept
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => onReject?.(booking.id)}>
          Reject
        </Button>
      </div>
    </Card>
  );
}

export default NearbyJobCard;
