import { PageHeader } from '../../../components/common/PageHeader';
import { Container } from '../../../components/ui/Layout/Container';
import { ReceiptCard } from '../components/ReceiptCard';
import { usePayments } from '../hooks/usePayments';

function PaymentDetails() {
  const { data } = usePayments();
  const payments = Array.isArray(data?.items) ? data.items : [];

  return (
    <Container className="space-y-8">
      <PageHeader eyebrow="Payment details" title="Receipts and reconciliation snapshots" description="A receipt-style view of the latest booking payment records." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {payments.slice(0, 6).map((payment) => (
          <ReceiptCard key={payment.id} payment={payment} />
        ))}
      </div>
    </Container>
  );
}

export default PaymentDetails;
