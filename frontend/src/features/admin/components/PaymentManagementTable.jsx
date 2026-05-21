import { Card } from '../../../components/ui/Layout/Card';
import { PaymentStatusBadge } from '../../payment/components/PaymentStatusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';

export function PaymentManagementTable({ payments = [] }) {
  return (
    <Card className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th className="py-2">Booking</th>
            <th className="py-2">Method</th>
            <th className="py-2">Amount</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-t border-border">
              <td className="py-3 text-foreground">{payment.bookingCode}</td>
              <td className="py-3 text-muted">{payment.method}</td>
              <td className="py-3 text-muted">{formatCurrency(payment.amount)}</td>
              <td className="py-3">
                <PaymentStatusBadge status={payment.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default PaymentManagementTable;
