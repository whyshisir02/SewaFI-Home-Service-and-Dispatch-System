import { Card } from '../../../components/ui/Layout/Card';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function ReceiptCard({ payment }) {
  return (
    <Card className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{payment.bookingCode}</p>
      <h3 className="text-lg font-semibold text-foreground">{payment.serviceName}</h3>
      <p className="text-sm text-muted">{formatDate(payment.date, { includeTime: true })}</p>
      <p className="font-display text-2xl text-foreground">{formatCurrency(payment.amount)}</p>
    </Card>
  );
}

export default ReceiptCard;
