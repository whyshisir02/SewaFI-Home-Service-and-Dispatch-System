import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import { Card } from '../../../components/ui/Layout/Card';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { BookingStatusBadge } from './BookingStatusBadge';

export const BookingCard = memo(function BookingCard({ booking, detailPath }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">{booking.bookingCode || 'Booking'}</p>
          <h3 className="mt-1 text-xl font-semibold text-foreground">{booking.service?.name || 'Service booking'}</h3>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>
      <div className="grid gap-3 text-sm text-muted md:grid-cols-3">
        <p>Scheduled: {formatDate(booking.scheduledTime, { includeTime: true })}</p>
        <p>Area: {booking.municipality || booking.district || 'Pending area'}</p>
        <p>Total: {formatCurrency(booking.totalPrice || booking.service?.basePrice || 0)}</p>
      </div>
      {detailPath ? (
        <Button as={Link} to={detailPath} variant="outline">
          View details
        </Button>
      ) : null}
    </Card>
  );
});

export default BookingCard;
