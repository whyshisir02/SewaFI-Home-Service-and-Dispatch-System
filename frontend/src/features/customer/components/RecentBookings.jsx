import { BookingCard } from '../../booking/components/BookingCard';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';

export function RecentBookings({ bookings = [] }) {
  if (!bookings.length) {
    return <EmptyState title="No bookings yet" description="Start by choosing a service and confirming a time slot." />;
  }

  return (
    <div className="space-y-4">
      {bookings.slice(0, 3).map((booking) => (
        <BookingCard key={booking.id} booking={booking} detailPath={`/customer/bookings/${booking.id}`} />
      ))}
    </div>
  );
}

export default RecentBookings;
