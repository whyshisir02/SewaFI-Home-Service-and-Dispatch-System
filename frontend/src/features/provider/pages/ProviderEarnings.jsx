import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw, WalletCards } from 'lucide-react';
import { Container } from '../../../components/ui/Layout/Container';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { ROUTES } from '../../../constants/routes.constant';
import { useProviderEarnings } from '../hooks/useProviderEarnings';

function ProviderEarnings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const paymentStatus = searchParams.get('paymentStatus') || 'all';
  const payoutStatus = searchParams.get('payoutStatus') || 'all';
  const page = Number(searchParams.get('page') || 1);

  const filters = {
    page,
    limit: 20,
    ...(search ? { search } : {}),
    ...(paymentStatus !== 'all' ? { paymentStatus } : {}),
    ...(payoutStatus !== 'all' ? { payoutStatus } : {}),
  };

  const { earningsQuery, summary, earnings, meta, providerProfile } = useProviderEarnings(filters);
  const approved = String(providerProfile?.status || '').toUpperCase() === 'APPROVED';
  const totalPages = Number(meta?.totalPages || 1);

  const filtered = useMemo(() => earnings, [earnings]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Provider Earnings"
        title="Earnings"
        description="Track gross amount, platform fee deduction, and net earnings."
        actions={(
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => earningsQuery.refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
      />

      {!approved ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">
            Your provider profile must be approved before earnings can be tracked.
          </p>
          <Button as={Link} to={ROUTES.provider.profile} variant="outline" className="mt-4 rounded-xl">
            View Profile
          </Button>
        </section>
      ) : null}

      {approved ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              { label: 'Total Gross', value: summary.totalGrossAmount },
              { label: 'Platform Fee Deducted', value: summary.totalPlatformFeeDeducted },
              { label: 'Total Net Earnings', value: summary.totalNetEarnings },
              { label: 'Pending Settlement', value: summary.pendingEarnings },
              { label: 'Settled Earnings', value: summary.settledEarnings },
              { label: 'Completed Paid Jobs', value: summary.completedPaidJobs, count: true },
            ].map((item) => (
              <article key={item.label} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">{item.label}</p>
                <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">
                  {item.count ? Number(item.value || 0) : formatCurrency(Number(item.value || 0))}
                </p>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
                <span>Search</span>
                <input
                  value={search}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearch(value);
                    setParam('search', value.trim());
                  }}
                  placeholder="Booking code or service"
                  className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
                />
              </label>
              <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
                <span>Payment Status</span>
                <select
                  value={paymentStatus}
                  onChange={(event) => setParam('paymentStatus', event.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
                >
                  <option value="all">Completed & Paid</option>
                  <option value="PAID">Paid</option>
                </select>
              </label>
              <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
                <span>Payout Status</span>
                <select
                  value={payoutStatus}
                  onChange={(event) => setParam('payoutStatus', event.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
                >
                  <option value="all">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="SETTLED">Settled</option>
                  <option value="HOLD">Hold</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--sf-text-main)]">
              <WalletCards className="h-5 w-5" />
              <h2 className="text-base font-bold">Earning Records</h2>
            </div>
            {earningsQuery.isLoading ? (
              <div className="mt-4 space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)]" />
                ))}
              </div>
            ) : null}
            {!earningsQuery.isLoading && filtered.length ? (
              <div className="mt-4 hidden overflow-hidden rounded-xl border border-[var(--sf-border)] lg:block">
                <table className="w-full text-left">
                  <thead className="bg-[var(--sf-surface-soft)]">
                    <tr className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">
                      <th className="px-4 py-3">Booking</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Gross</th>
                      <th className="px-4 py-3">Platform Fee</th>
                      <th className="px-4 py-3">Net Earning</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Payout</th>
                      <th className="px-4 py-3">Paid At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id} className="border-t border-[var(--sf-border)]">
                        <td className="px-4 py-3 text-sm text-[var(--sf-text-main)]">{item.bookingCode || item.bookingId}</td>
                        <td className="px-4 py-3 text-sm text-[var(--sf-text-muted)]">{item.service?.name || 'Service'}</td>
                        <td className="px-4 py-3 text-sm text-[var(--sf-text-muted)]">{formatCurrency(Number(item.grossAmount || 0))}</td>
                        <td className="px-4 py-3 text-sm text-[var(--sf-text-muted)]">{formatCurrency(Number(item.platformFeeAmount || 0))}</td>
                        <td className="px-4 py-3 text-sm text-[var(--sf-text-muted)]">{formatCurrency(Number(item.providerEarningAmount || 0))}</td>
                        <td className="px-4 py-3 text-sm"><StatusBadge status={item.paymentStatus} /></td>
                        <td className="px-4 py-3 text-sm"><StatusBadge status={item.payoutStatus} /></td>
                        <td className="px-4 py-3 text-sm text-[var(--sf-text-muted)]">{item.paidAt ? formatDate(item.paidAt) : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {!earningsQuery.isLoading && filtered.length ? (
              <div className="mt-4 space-y-3 lg:hidden">
                {filtered.map((item) => (
                  <article key={item.id} className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--sf-text-main)]">{item.bookingCode || item.bookingId}</p>
                        <p className="text-sm text-[var(--sf-text-muted)]">{item.service?.name || 'Service'}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <StatusBadge status={item.paymentStatus} />
                        <StatusBadge status={item.payoutStatus} />
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-[var(--sf-text-muted)]">
                      <p>Gross: {formatCurrency(Number(item.grossAmount || 0))}</p>
                      <p>Platform fee: {formatCurrency(Number(item.platformFeeAmount || 0))}</p>
                      <p>Net earning: {formatCurrency(Number(item.providerEarningAmount || 0))}</p>
                      <p>Paid at: {item.paidAt ? formatDate(item.paidAt) : 'N/A'}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            {!earningsQuery.isLoading && !filtered.length ? (
              <p className="mt-4 text-sm text-[var(--sf-text-muted)]">No earnings available yet.</p>
            ) : null}
            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-[var(--sf-text-muted)]">Page {meta?.page || page} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl"
                    disabled={(meta?.page || page) <= 1}
                    onClick={() => setParam('page', String(Math.max(1, (meta?.page || page) - 1)))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl"
                    disabled={(meta?.page || page) >= totalPages}
                    onClick={() => setParam('page', String(Math.min(totalPages, (meta?.page || page) + 1)))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </Container>
  );
}

export default ProviderEarnings;
