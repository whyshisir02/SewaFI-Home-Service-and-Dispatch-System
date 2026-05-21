import { Card } from '../../../components/ui/Layout/Card';
import { formatCurrency } from '../../../utils/formatCurrency';

export function PaymentSummary({ payments = [] }) {
  const total = payments.reduce((sum, payment) => sum + Number(payment.finalAmount ?? payment.providerProposedAmount ?? payment.estimatedAmount ?? 0), 0);
  const pending = payments.filter((payment) => payment.paymentStatus !== 'PAID').length;

  return (
    <Card className="space-y-2">
      <h3 className="text-lg font-semibold text-foreground">Payment summary</h3>
      <p className="text-sm text-muted">Total processed</p>
      <p className="font-display text-3xl text-foreground">{formatCurrency(total)}</p>
      <p className="text-sm text-muted">{pending} payments still pending reconciliation</p>
    </Card>
  );
}

export default PaymentSummary;
