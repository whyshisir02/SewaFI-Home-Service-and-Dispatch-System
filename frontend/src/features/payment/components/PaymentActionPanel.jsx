import { Card } from '../../../components/ui/Layout/Card';
import { Button } from '../../../components/ui/Button/Button';

export function PaymentActionPanel({
  paymentStatus,
  onConfirmPayment,
  onRaiseIssue,
  confirmLoading,
  disputeLoading,
  canAct,
}) {
  const isPaid = String(paymentStatus || '').toUpperCase() === 'PAID';
  const isAwaitingConfirmation = String(paymentStatus || '').toUpperCase() === 'AWAITING_CONFIRMATION';

  return (
    <Card className="space-y-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h2 className="text-base font-bold text-[var(--sf-text-main)]">Payment Action</h2>
      {isPaid ? <p className="text-sm text-[var(--sf-text-muted)]">Payment completed.</p> : null}

      {!isPaid && isAwaitingConfirmation && canAct ? (
        <div className="space-y-2">
          <Button
            type="button"
            className="h-11 w-full rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95"
            onClick={onConfirmPayment}
            loading={confirmLoading}
          >
            {confirmLoading ? 'Confirming...' : 'Confirm Payment'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl"
            onClick={onRaiseIssue}
            loading={disputeLoading}
          >
            {disputeLoading ? 'Submitting...' : 'Raise Issue'}
          </Button>
        </div>
      ) : null}

      {!isPaid && !isAwaitingConfirmation ? (
        <p className="text-sm text-[var(--sf-text-muted)]">Payment will be available after provider submits the final amount.</p>
      ) : null}
    </Card>
  );
}

export default PaymentActionPanel;
