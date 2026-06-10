import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button/Button';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { Input } from '../../../components/ui/Input/Input';
import { Card } from '../../../components/ui/Layout/Card';
import { Container } from '../../../components/ui/Layout/Container';
import { ROUTES } from '../../../constants/routes.constant';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import ReceiptSummaryCard from '../components/ReceiptSummaryCard';
import { useAdminReceipts, useDownloadAdminReceipt } from '../hooks/useReceipts';

function AdminReceiptsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page') || 1);
  const receiptsQuery = useAdminReceipts({ search, page, limit: 20 });
  const downloadMutation = useDownloadAdminReceipt();
  const receipts = Array.isArray(receiptsQuery.data?.items) ? receiptsQuery.data.items : [];
  const meta = receiptsQuery.data?.meta;

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const handleDownload = async (receipt) => {
    try {
      await downloadMutation.mutateAsync({
        receiptId: receipt.id,
        fallbackName: `${receipt.receiptNumber || 'receipt'}.pdf`,
      });
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to download receipt right now.'));
    }
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Admin"
        title="Receipts"
        description="Review completed booking receipts and download customer payment records."
        actions={(
          <Button as={Link} to={ROUTES.admin.payments} variant="outline" className="h-11 rounded-xl">
            Back to Payments
          </Button>
        )}
      />

      <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <Input
          label="Search receipts"
          value={search}
          onChange={(event) => setParam('search', event.target.value)}
          placeholder="Booking, service, customer, provider"
        />
      </Card>

      {receiptsQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-2xl" />)}
        </div>
      ) : null}

      {!receiptsQuery.isLoading && receiptsQuery.isError ? (
        <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">Unable to load receipts right now.</p>
          <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => receiptsQuery.refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!receiptsQuery.isLoading && !receiptsQuery.isError && !receipts.length ? (
        <EmptyState title="No receipts found." description="Completed paid bookings will appear here as receipts." />
      ) : null}

      {!receiptsQuery.isLoading && !receiptsQuery.isError && receipts.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {receipts.map((receipt) => (
            <div key={receipt.id} className="space-y-3">
              <ReceiptSummaryCard receipt={receipt} showParties variant="admin" />
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  as={Link}
                  to={ROUTES.admin.receiptDetails.replace(':receiptId', receipt.id)}
                  variant="outline"
                  className="h-10 rounded-xl"
                >
                  View Receipt
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl"
                  onClick={() => handleDownload(receipt)}
                  loading={downloadMutation.isPending && downloadMutation.variables?.receiptId === receipt.id}
                >
                  Download PDF
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {meta?.totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-3">
          <p className="text-sm text-[var(--sf-text-muted)]">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-xl" disabled={meta.page <= 1} onClick={() => setParam('page', String(meta.page - 1))}>
              Previous
            </Button>
            <Button type="button" variant="outline" className="h-9 rounded-xl" disabled={meta.page >= meta.totalPages} onClick={() => setParam('page', String(meta.page + 1))}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </Container>
  );
}

export default AdminReceiptsPage;
