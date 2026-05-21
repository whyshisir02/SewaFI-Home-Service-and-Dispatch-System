import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Layout/Card';
import { Button } from '../../../components/ui/Button/Button';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { ROUTES } from '../../../constants/routes.constant';

export function CashPaymentCard({ payment }) {
  const bookingId = payment?.bookingId || payment?.booking?.id || '';
  const paymentDetailsPath = ROUTES.customer.paymentDetails.replace(':bookingId', bookingId);
  const amount = Number(payment?.finalAmount ?? payment?.providerProposedAmount ?? payment?.estimatedAmount ?? 0);

  return (
    <Card className="space-y-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[var(--sf-text-main)]">{payment?.serviceName || payment?.booking?.service?.name || 'Service'}</p>
        <PaymentStatusBadge status={payment?.paymentStatus} />
      </div>
      <p className="text-sm text-[var(--sf-text-muted)]">Method: {payment?.paymentMethod || 'Pending'}</p>
      <p className="text-lg font-semibold text-[var(--sf-text-main)]">{amount ? formatCurrency(amount) : 'Amount pending'}</p>
      <Button as={Link} to={paymentDetailsPath} variant="outline" className="h-10 w-full rounded-xl">
        View Payment Details
      </Button>
    </Card>
  );
}

export default CashPaymentCard;
