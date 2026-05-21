import { PageHeader } from '../../../components/common/PageHeader';
import { Container } from '../../../components/ui/Layout/Container';
import { Card } from '../../../components/ui/Layout/Card';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { Button } from '../../../components/ui/Button/Button';
import { PaymentSummary } from '../components/PaymentSummary';
import { CashPaymentCard } from '../components/CashPaymentCard';
import { usePayments } from '../hooks/usePayments';

function PaymentHistory() {
  const paymentsQuery = usePayments();
  const payments = Array.isArray(paymentsQuery.data?.items) ? paymentsQuery.data.items : [];

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader eyebrow="Payments" title="Payment history" description="Track booking payment status and open payment details for each booking." />
      <PaymentSummary payments={payments} />

      {paymentsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-2xl" />)}
        </div>
      ) : null}

      {!paymentsQuery.isLoading && paymentsQuery.isError ? (
        <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">Unable to load payments right now.</p>
          <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => paymentsQuery.refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!paymentsQuery.isLoading && !paymentsQuery.isError && !payments.length ? (
        <EmptyState title="No payment records yet." description="Payment records will appear once bookings are available." />
      ) : null}

      {!paymentsQuery.isLoading && !paymentsQuery.isError && payments.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {payments.map((payment) => (
            <CashPaymentCard key={payment.id} payment={payment} />
          ))}
        </div>
      ) : null}
    </Container>
  );
}

export default PaymentHistory;
