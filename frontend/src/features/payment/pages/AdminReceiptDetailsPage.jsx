import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button/Button';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { Container } from '../../../components/ui/Layout/Container';
import { Card } from '../../../components/ui/Layout/Card';
import { ROUTES } from '../../../constants/routes.constant';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import ReceiptSummaryCard from '../components/ReceiptSummaryCard';
import { useAdminReceipt, useDownloadAdminReceipt } from '../hooks/useReceipts';

function AdminReceiptDetailsPage() {
  const { receiptId, paymentId } = useParams();
  const receiptQuery = useAdminReceipt({ receiptId, paymentId });
  const downloadMutation = useDownloadAdminReceipt();
  const receipt = receiptQuery.data;

  const handleDownload = async () => {
    if (!receipt?.id) return;
    try {
      await downloadMutation.mutateAsync({
        receiptId: receipt.id,
        fallbackName: `${receipt.receiptNumber || 'receipt'}.pdf`,
      });
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to download receipt right now.'));
    }
  };

  if (receiptQuery.isLoading) {
    return (
      <Container className="space-y-6 py-6 lg:py-8">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </Container>
    );
  }

  if (receiptQuery.isError || !receipt?.id) {
    return (
      <Container className="py-8">
        <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
          <EmptyState title="Receipt not available right now." description="We could not load this receipt." />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => receiptQuery.refetch()} className="rounded-xl">
              Retry
            </Button>
            <Button as={Link} to={ROUTES.admin.receipts} variant="outline" className="rounded-xl">
              Back to Receipts
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Admin Receipt"
        title="Receipt Details"
        description="Completed payment snapshot for support, reconciliation, and customer reference."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button as={Link} to={ROUTES.admin.receipts} variant="outline" className="h-11 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
              Back to Receipts
            </Button>
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={handleDownload} loading={downloadMutation.isPending}>
              Download PDF
            </Button>
          </div>
        )}
      />

      <ReceiptSummaryCard receipt={receipt} showParties variant="admin" />
    </Container>
  );
}

export default AdminReceiptDetailsPage;
