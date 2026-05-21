import { BOOKING_STATUS_META, getBookingDisplayStatus } from '../../../constants/booking-status.constant';
import { Badge } from '../../../components/ui/DataDisplay/Badge';

const toneMap = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

export function BookingStatusBadge({ status, booking, audience, surface, className }) {
  if (booking) {
    const display = getBookingDisplayStatus(booking, { audience, surface });
    return (
      <Badge tone={toneMap[display.tone] || 'neutral'} className={className}>
        {display.label}
      </Badge>
    );
  }

  const resolvedStatus = String(status || '').toUpperCase() || 'PENDING';
  const meta = BOOKING_STATUS_META[resolvedStatus] || { label: resolvedStatus, tone: 'neutral' };
  return (
    <Badge tone={toneMap[meta.tone] || 'neutral'} className={className}>
      {meta.label}
    </Badge>
  );
}

export default BookingStatusBadge;
