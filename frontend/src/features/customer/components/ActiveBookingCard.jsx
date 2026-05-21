import { BookingCard } from '../../booking/components/BookingCard';

export function ActiveBookingCard({ booking }) {
  if (!booking) return null;
  return <BookingCard booking={booking} detailPath={`/customer/bookings/${booking.id}`} />;
}

export default ActiveBookingCard;
