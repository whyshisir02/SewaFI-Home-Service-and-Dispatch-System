import { StatusBadge } from '../../../components/common/StatusBadge';
import { Card } from '../../../components/ui/Layout/Card';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function ReceiptSummaryCard({
  receipt,
  showParties = false,
  variant = 'admin',
  showInternalBreakdown,
}) {
  const resolvedShowInternalBreakdown =
    showInternalBreakdown ?? variant !== 'customer';

  return (
    <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sf-text-muted)]">
            {receipt?.receiptNumber || 'Receipt'}
          </p>
          <h2 className="mt-2 truncate text-xl font-bold text-[var(--sf-text-main)]">
            {receipt?.serviceName || 'Service receipt'}
          </h2>
          <p className="mt-1 text-sm text-[var(--sf-text-muted)]">
            Booking {receipt?.bookingCode || 'N/A'}
          </p>
        </div>
        <StatusBadge status={receipt?.paymentStatus || 'PAID'} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">Total Paid</p>
          <p className="mt-1 text-2xl font-extrabold text-[var(--sf-text-main)]">
            {formatCurrency(Number(receipt?.finalAmount || 0))}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">Paid On</p>
          <p className="mt-1 text-sm text-[var(--sf-text-main)]">
            {receipt?.paymentCompletedAt ? formatDate(receipt.paymentCompletedAt, { includeTime: true }) : 'N/A'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-[var(--sf-surface-soft)] p-3 text-sm text-[var(--sf-text-muted)]">
          <p>Service Amount: {formatCurrency(Number(receipt?.grossAmount || 0))}</p>
          <p className="mt-1">Total Paid: {formatCurrency(Number(receipt?.finalAmount || 0))}</p>
          {resolvedShowInternalBreakdown ? (
            <>
              <p className="mt-1">Platform Commission: {formatCurrency(Number(receipt?.platformFeeAmount || 0))}</p>
              <p className="mt-1">Provider Earning: {formatCurrency(Number(receipt?.providerEarningAmount || 0))}</p>
            </>
          ) : null}
        </div>
        <div className="rounded-xl bg-[var(--sf-surface-soft)] p-3 text-sm text-[var(--sf-text-muted)]">
          <p>Payment Method: {receipt?.paymentMethod || 'CASH'}</p>
          <p className="mt-1">Currency: {receipt?.currency || 'NPR'}</p>
          <p className="mt-1">Recorded: {receipt?.createdAt ? formatDate(receipt.createdAt, { includeTime: true }) : 'N/A'}</p>
        </div>
      </div>

      {showParties ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--sf-border)] p-3 text-sm text-[var(--sf-text-muted)]">
            <p className="font-semibold text-[var(--sf-text-main)]">Customer</p>
            <p className="mt-1">{receipt?.customer?.name || 'N/A'}</p>
            {receipt?.customer?.email ? <p>{receipt.customer.email}</p> : null}
            {receipt?.customer?.phone ? <p>{receipt.customer.phone}</p> : null}
          </div>
          <div className="rounded-xl border border-[var(--sf-border)] p-3 text-sm text-[var(--sf-text-muted)]">
            <p className="font-semibold text-[var(--sf-text-main)]">Provider</p>
            <p className="mt-1">{receipt?.provider?.name || 'Not assigned'}</p>
            {receipt?.provider?.email ? <p>{receipt.provider.email}</p> : null}
            {receipt?.provider?.phone ? <p>{receipt.provider.phone}</p> : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export default ReceiptSummaryCard;
