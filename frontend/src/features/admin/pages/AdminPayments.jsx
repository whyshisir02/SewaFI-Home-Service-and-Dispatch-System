import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Banknote, HandCoins, RefreshCw, WalletCards } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Container } from '../../../components/ui/Layout/Container';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/ui/Overlay/Modal';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { getErrorMessage } from '../../../utils/errorHandler';
import { appToast } from '../../../lib/toast';
import { useAdminPaymentDetails, useAdminPayments } from '../hooks/useAdminPayments';

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

function AdminPayments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [settleTarget, setSettleTarget] = useState(null);
  const [finalAmount, setFinalAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const search = searchParams.get('search') || '';
  const paymentStatus = searchParams.get('paymentStatus') || 'all';
  const payoutStatus = searchParams.get('payoutStatus') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  const filters = {
    page,
    limit: 20,
    ...(search ? { search } : {}),
    ...(paymentStatus !== 'all' ? { paymentStatus } : {}),
    ...(payoutStatus !== 'all' ? { payoutStatus } : {}),
    ...(sort !== 'newest' ? { sort } : {}),
  };

  const {
    paymentsQuery,
    paymentStatsQuery,
    resolveDisputeMutation,
    settleProviderMutation,
  } = useAdminPayments(filters);

  const payments = useMemo(() => toArray(paymentsQuery.data), [paymentsQuery.data]);
  const meta = paymentsQuery.data?.meta || null;
  const stats = paymentStatsQuery.data || {};
  const detailsQuery = useAdminPaymentDetails(selectedPaymentId);
  const selectedPayment = detailsQuery.data || payments.find((item) => item?.id === selectedPaymentId);
  const paymentsActionPending = resolveDisputeMutation.isPending || settleProviderMutation.isPending;

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === 'newest') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const onResolveDispute = async () => {
    if (!resolveTarget?.id) return;
    const amount = Number(finalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      appToast.error('Please enter a valid final amount.');
      return;
    }
    try {
      await resolveDisputeMutation.mutateAsync({
        paymentId: resolveTarget.id,
        finalAmount: amount,
        adminNote: adminNote.trim() || undefined,
        markPaid: true,
      });
      appToast.success('Dispute resolved successfully.');
      setResolveTarget(null);
      setFinalAmount('');
      setAdminNote('');
      paymentsQuery.refetch();
      paymentStatsQuery.refetch();
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to resolve dispute right now.'));
    }
  };

  const onSettleProvider = async () => {
    if (!settleTarget?.id) return;
    try {
      await settleProviderMutation.mutateAsync({
        paymentId: settleTarget.id,
        adminNote: adminNote.trim() || undefined,
      });
      appToast.success('Provider settlement marked as settled.');
      setSettleTarget(null);
      setAdminNote('');
      paymentsQuery.refetch();
      paymentStatsQuery.refetch();
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to settle provider right now.'));
    }
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Admin"
        title="Payments"
        description="Review manual/cash payment records, platform commission, and provider settlements."
        actions={(
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => { paymentsQuery.refetch(); paymentStatsQuery.refetch(); }}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: 'Total Gross Revenue', value: stats.totalGrossAmount, icon: Banknote },
          { label: 'Platform Commission', value: stats.totalPlatformCommission, icon: HandCoins },
          { label: 'Provider Earnings', value: stats.totalProviderEarnings, icon: WalletCards },
          {
            label: 'Pending Settlement Amount',
            value: stats.pendingSettlementAmount,
            helper: `${Number(stats.pendingSettlements || 0)} payouts pending`,
            icon: WalletCards,
          },
          { label: 'Settled Provider Earnings', value: stats.settledProviderEarnings, icon: WalletCards },
          {
            label: 'Disputed Amount',
            value: stats.disputedAmount,
            helper: `${Number(stats.disputedPaymentsCount || 0)} disputes`,
            icon: HandCoins,
          },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--sf-text-muted)]">
              <card.icon className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.12em]">{card.label}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">
                  {formatCurrency(Number(card.value || 0))}
                </p>
                {card.helper ? <p className="mt-1 text-xs text-[var(--sf-text-muted)]">{card.helper}</p> : null}
              </article>
            ))}
          </section>

      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <Input label="Search" value={search} onChange={(event) => setParam('search', event.target.value)} placeholder="Booking, customer, provider..." />
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Payment Status</span>
            <select value={paymentStatus} onChange={(event) => setParam('paymentStatus', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              <option value="all">All</option>
              <option value="PENDING">Pending</option>
              <option value="AWAITING_CONFIRMATION">Awaiting Confirmation</option>
              <option value="PAID">Paid</option>
              <option value="DISPUTED">Disputed</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Payout Status</span>
            <select value={payoutStatus} onChange={(event) => setParam('payoutStatus', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              <option value="all">All</option>
              <option value="PENDING">Pending</option>
              <option value="SETTLED">Settled</option>
              <option value="HOLD">Hold</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Sort</span>
            <select value={sort} onChange={(event) => setParam('sort', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount_desc">Amount high-low</option>
              <option value="amount_asc">Amount low-high</option>
            </select>
          </label>
        </div>
      </section>

      {paymentsQuery.isLoading ? (
        <section className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
          ))}
        </section>
      ) : null}

      {!paymentsQuery.isLoading && paymentsQuery.isError ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load payments right now.</p>
          <Button type="button" variant="outline" className="mt-3 rounded-xl" onClick={() => paymentsQuery.refetch()}>
            Retry
          </Button>
        </section>
      ) : null}

      {!paymentsQuery.isLoading && !paymentsQuery.isError && !payments.length ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">No payment records found.</p>
        </section>
      ) : null}

      {!paymentsQuery.isLoading && !paymentsQuery.isError && payments.length ? (
        <section className="hidden overflow-x-auto rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] lg:block">
          <table className="w-full min-w-[1280px] text-left">
            <thead className="bg-[var(--sf-surface-soft)]">
              <tr className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Gross</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Provider Earning</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Payout</th>
                <th className="sticky right-0 z-10 whitespace-nowrap bg-[var(--sf-surface-soft)] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-[var(--sf-border)]">
                  <td className="px-4 py-3 text-sm text-[var(--sf-text-main)]">
                    <p className="max-w-[180px] truncate">{payment.bookingCode || payment.bookingId}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--sf-text-muted)]">
                    <p className="max-w-[170px] truncate">{payment.serviceName || 'Service'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--sf-text-muted)]">
                    <p className="max-w-[160px] truncate text-[var(--sf-text-main)]">{payment.customer?.name || '—'}</p>
                    {payment.customer?.email ? <p className="max-w-[220px] truncate text-xs">{payment.customer.email}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--sf-text-muted)]">
                    <p className="max-w-[160px] truncate text-[var(--sf-text-main)]">{payment.provider?.name || '—'}</p>
                    {payment.provider?.email ? <p className="max-w-[220px] truncate text-xs">{payment.provider.email}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--sf-text-muted)]">{formatCurrency(Number(payment.grossAmount || 0))}</td>
                  <td className="px-4 py-3 text-sm text-[var(--sf-text-muted)]">{formatCurrency(Number(payment.platformFeeAmount || 0))}</td>
                  <td className="px-4 py-3 text-sm text-[var(--sf-text-muted)]">{formatCurrency(Number(payment.providerEarningAmount || 0))}</td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={payment.paymentStatus} /></td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={payment.payoutStatus} /></td>
                  <td className="sticky right-0 z-[1] whitespace-nowrap bg-[var(--sf-surface)] px-4 py-3 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.18)]">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setSelectedPaymentId(payment.id)}>
                        View
                      </Button>
                      {payment.paymentStatus === 'DISPUTED' ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-xl"
                          onClick={() => setResolveTarget(payment)}
                          disabled={paymentsActionPending}
                        >
                          Resolve
                        </Button>
                      ) : null}
                      {payment.paymentStatus === 'PAID' && payment.payoutStatus === 'PENDING' && payment.bookingStatus === 'COMPLETED' ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-xl"
                          onClick={() => setSettleTarget(payment)}
                          disabled={paymentsActionPending}
                        >
                          Mark Settled
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {!paymentsQuery.isLoading && !paymentsQuery.isError && payments.length ? (
        <section className="space-y-3 lg:hidden">
          {payments.map((payment) => (
            <article key={payment.id} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--sf-text-main)]">{payment.bookingCode || payment.bookingId}</p>
                  <p className="text-sm text-[var(--sf-text-muted)]">{payment.serviceName || 'Service'}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <StatusBadge status={payment.paymentStatus} />
                  <StatusBadge status={payment.payoutStatus} />
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-[var(--sf-text-muted)]">
                <p>Customer: {payment.customer?.name || 'N/A'}</p>
                <p>Provider: {payment.provider?.name || 'N/A'}</p>
                <p>Gross: {formatCurrency(Number(payment.grossAmount || 0))}</p>
                <p>Commission: {formatCurrency(Number(payment.platformFeeAmount || 0))}</p>
                <p>Provider earning: {formatCurrency(Number(payment.providerEarningAmount || 0))}</p>
              </div>
              <div className="mt-4 grid gap-2">
                <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setSelectedPaymentId(payment.id)}>
                  View Details
                </Button>
                {payment.paymentStatus === 'DISPUTED' ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl"
                    onClick={() => setResolveTarget(payment)}
                    disabled={paymentsActionPending}
                  >
                    Resolve Dispute
                  </Button>
                ) : null}
                {payment.paymentStatus === 'PAID' && payment.payoutStatus === 'PENDING' && payment.bookingStatus === 'COMPLETED' ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl"
                    onClick={() => setSettleTarget(payment)}
                    disabled={paymentsActionPending}
                  >
                    Mark Settled
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {meta?.totalPages > 1 ? (
        <section className="flex items-center justify-between rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-3">
          <p className="text-sm text-[var(--sf-text-muted)]">Page {meta?.page || page} of {meta?.totalPages}</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-xl" disabled={(meta?.page || page) <= 1} onClick={() => setParam('page', String(Math.max(1, (meta?.page || page) - 1)))}>
              Previous
            </Button>
            <Button type="button" variant="outline" className="h-9 rounded-xl" disabled={(meta?.page || page) >= meta.totalPages} onClick={() => setParam('page', String(Math.min(meta.totalPages, (meta?.page || page) + 1)))}>
              Next
            </Button>
          </div>
        </section>
      ) : null}

      <Modal open={Boolean(selectedPaymentId)} onClose={() => setSelectedPaymentId(null)} title="Payment Details">
        {selectedPayment ? (
          <div className="space-y-2 text-sm text-[var(--sf-text-muted)]">
            <p><span className="font-semibold text-[var(--sf-text-main)]">Booking:</span> {selectedPayment.bookingCode || selectedPayment.bookingId}</p>
            <p><span className="font-semibold text-[var(--sf-text-main)]">Service:</span> {selectedPayment.serviceName || 'Service'}</p>
            <p><span className="font-semibold text-[var(--sf-text-main)]">Customer:</span> {selectedPayment.customer?.name || '—'}{selectedPayment.customer?.email ? ` (${selectedPayment.customer.email})` : ''}</p>
            <p><span className="font-semibold text-[var(--sf-text-main)]">Provider:</span> {selectedPayment.provider?.name || '—'}{selectedPayment.provider?.email ? ` (${selectedPayment.provider.email})` : ''}</p>
            <p><span className="font-semibold text-[var(--sf-text-main)]">Gross:</span> {formatCurrency(Number(selectedPayment.grossAmount || 0))}</p>
            <p><span className="font-semibold text-[var(--sf-text-main)]">Commission:</span> {formatCurrency(Number(selectedPayment.platformFeeAmount || 0))}</p>
            <p><span className="font-semibold text-[var(--sf-text-main)]">Provider Earning:</span> {formatCurrency(Number(selectedPayment.providerEarningAmount || 0))}</p>
            <p><span className="font-semibold text-[var(--sf-text-main)]">Payment Status:</span> <StatusBadge status={selectedPayment.paymentStatus} className="ml-2" /></p>
            <p><span className="font-semibold text-[var(--sf-text-main)]">Payout Status:</span> <StatusBadge status={selectedPayment.payoutStatus} className="ml-2" /></p>
            {selectedPayment.paidAt ? <p><span className="font-semibold text-[var(--sf-text-main)]">Paid At:</span> {formatDate(selectedPayment.paidAt, { includeTime: true })}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-[var(--sf-text-muted)]">Loading payment details...</p>
        )}
      </Modal>

      <Modal open={Boolean(resolveTarget)} onClose={() => { setResolveTarget(null); setFinalAmount(''); setAdminNote(''); }} title="Resolve Dispute">
        <div className="space-y-3">
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Final Amount (NPR)</span>
            <input
              type="number"
              min="1"
              value={finalAmount}
              onChange={(event) => setFinalAmount(event.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
            />
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Admin Note</span>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              className="w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 py-2 text-sm text-[var(--sf-text-main)]"
            />
          </label>
          <Button
            type="button"
            className="h-10 rounded-xl"
            onClick={onResolveDispute}
            loading={resolveDisputeMutation.isPending}
            disabled={resolveDisputeMutation.isPending}
          >
            Resolve & Mark Paid
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(settleTarget)} onClose={() => { setSettleTarget(null); setAdminNote(''); }} title="Settle Provider Earning">
        <div className="space-y-3">
          <p className="text-sm text-[var(--sf-text-muted)]">
            Provider earning: {formatCurrency(Number(settleTarget?.providerEarningAmount || 0))}
          </p>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Admin Note</span>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              className="w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 py-2 text-sm text-[var(--sf-text-main)]"
            />
          </label>
          <Button
            type="button"
            className="h-10 rounded-xl"
            onClick={onSettleProvider}
            loading={settleProviderMutation.isPending}
            disabled={settleProviderMutation.isPending}
          >
            Mark Settled
          </Button>
        </div>
      </Modal>
    </Container>
  );
}

export default AdminPayments;
