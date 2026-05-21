import { Card } from '../../../components/ui/Layout/Card';
import { BookingStatusBadge } from '../../booking/components/BookingStatusBadge';

export function BookingManagementTable({ bookings = [] }) {
  return (
    <Card className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th className="py-2">Code</th>
            <th className="py-2">Service</th>
            <th className="py-2">Area</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-t border-border">
              <td className="py-3 text-foreground">{booking.bookingCode}</td>
              <td className="py-3 text-muted">{booking.service?.name}</td>
              <td className="py-3 text-muted">{booking.district}</td>
              <td className="py-3">
                <BookingStatusBadge status={booking.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default BookingManagementTable;
