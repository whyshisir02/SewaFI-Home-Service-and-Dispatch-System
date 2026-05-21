import { Card } from '../../../components/ui/Layout/Card';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { formatDate } from '../../../utils/formatDate';

export function PaymentStatusResult({ paymentStatus, transactionId, paidAt, verifying }) {
  if (!paymentStatus && !verifying) return null;

  return (
    <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h2 className="text-base font-bold text-[var(--sf-text-main)]">Payment Status</h2>
      {verifying ? (
        <p className="mt-3 text-sm text-[var(--sf-text-muted)]">Verifying payment status...</p>
      ) : (
        <div className="mt-3 space-y-2 text-sm text-[var(--sf-text-muted)]">
          <div className="flex items-center gap-2">
            <StatusBadge status={paymentStatus} />
            {paymentStatus === 'PAID' ? <span className="text-[var(--sf-text-main)]">Payment completed.</span> : null}
          </div>
          {transactionId ? <p>Transaction ID: {transactionId}</p> : null}
          {paidAt ? <p>Paid At: {formatDate(paidAt, { includeTime: true })}</p> : null}
        </div>
      )}
    </Card>
  );
}

export default PaymentStatusResult;

