import { Card } from '../../../components/ui/Layout/Card';
import { formatCurrency } from '../../../utils/formatCurrency';

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <span className="text-[var(--sf-text-muted)]">{label}</span>
    <span className="font-semibold text-[var(--sf-text-main)]">{value}</span>
  </div>
);

export function AmountBreakdownCard({ payment, booking }) {
  const estimated = payment?.estimatedAmount ?? booking?.estimatedAmount ?? booking?.estimatedPrice ?? booking?.basePrice ?? null;
  const proposedAmount = payment?.providerProposedAmount ?? booking?.providerProposedAmount ?? null;
  const finalAmount = payment?.finalAmount ?? booking?.finalAmount ?? booking?.finalPrice ?? booking?.totalPrice ?? null;
  const paidAmount = payment?.paymentStatus === 'PAID' ? (finalAmount ?? proposedAmount ?? estimated) : null;
  const payable = proposedAmount ?? finalAmount ?? estimated;

  return (
    <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h2 className="text-base font-bold text-[var(--sf-text-main)]">Amount Breakdown</h2>
      <div className="mt-4 space-y-3">
        {estimated != null ? <Row label="Estimated Price" value={formatCurrency(Number(estimated))} /> : null}
        {proposedAmount != null ? <Row label="Provider Proposed Amount" value={formatCurrency(Number(proposedAmount))} /> : null}
        {finalAmount != null ? <Row label="Confirmed Final Amount" value={formatCurrency(Number(finalAmount))} /> : null}
        {paidAmount != null ? <Row label="Paid Amount" value={formatCurrency(Number(paidAmount))} /> : null}
        {payable != null ? <Row label="Total Payable" value={formatCurrency(Number(payable))} /> : null}
      </div>
      {payable == null ? (
        <p className="mt-3 text-sm text-[var(--sf-text-muted)]">Payment amount is not available yet.</p>
      ) : null}
    </Card>
  );
}

export default AmountBreakdownCard;
