import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, RefreshCw, Users, Wrench, CalendarCheck2, CircleDollarSign } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Container } from '../../../components/ui/Layout/Container';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { getErrorMessage } from '../../../utils/errorHandler';
import { toArray } from '../../../utils/collection';
import { appToast } from '../../../lib/toast';
import { adminApi } from '../api/admin.api';
import { useAdminReports } from '../hooks/useAdminReports';
import { useServiceCategories } from '../../services/hooks/useServiceCategories';

const rangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_3_months', label: 'Last 3 months' },
];

const reportTypeOptions = [
  { value: 'overview', label: 'Overview' },
  { value: 'bookings', label: 'Bookings' },
  { value: 'services', label: 'Services' },
  { value: 'providers', label: 'Providers' },
  { value: 'users', label: 'Users' },
  { value: 'payments', label: 'Payments' },
];

function SectionCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
      <h2 className="text-lg font-bold text-[var(--sf-text-main)]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function EmptyMessage({ text }) {
  return <p className="text-sm text-[var(--sf-text-muted)]">{text}</p>;
}

function AdminReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [supportsExport, setSupportsExport] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const range = searchParams.get('range') || 'last_30_days';
  const type = searchParams.get('type') || 'overview';
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';

  const filters = useMemo(
    () => ({
      range,
      type,
      ...(category !== 'all' ? { categoryId: category } : {}),
      ...(search ? { search } : {}),
    }),
    [category, range, search, type]
  );

  const reports = useAdminReports(filters);
  const categoriesQuery = useServiceCategories();

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const overview = reports.overviewQuery.data?.overview || reports.overviewQuery.data || {};
  const bookingTrends = toArray(reports.bookingsQuery.data, ['trends', 'bookings', 'series']);
  const serviceDemand = toArray(reports.servicesQuery.data, ['services', 'demand', 'items']);
  const providerPerformance = toArray(reports.providersQuery.data, ['providers', 'performance', 'items']);
  const userGrowth = toArray(reports.usersQuery.data, ['growth', 'users', 'series']);
  const paymentReport = toArray(reports.paymentsQuery.data, ['payments', 'revenue', 'series']);

  const hasPaymentReport = paymentReport.length > 0
    || reports.paymentsQuery.data?.totalRevenue != null
    || reports.paymentsQuery.data?.revenue != null;

  const summaryCards = [
    { label: 'Total Bookings', value: overview?.totalBookings, icon: CalendarCheck2, money: false },
    { label: 'Completed Bookings', value: overview?.completedBookings, icon: CalendarCheck2, money: false },
    { label: 'Cancellation Rate', value: overview?.cancellationRate != null ? `${overview.cancellationRate}%` : null, icon: BarChart3, money: false },
    { label: 'Active Providers', value: overview?.activeProviders, icon: Users, money: false },
    { label: 'New Users', value: overview?.newUsers ?? overview?.totalUsers, icon: Users, money: false },
    { label: 'Revenue', value: overview?.totalRevenue, icon: CircleDollarSign, money: true },
  ].filter((card) => card.value != null);

  const anyLoading = reports.overviewQuery.isLoading
    && reports.bookingsQuery.isLoading
    && reports.servicesQuery.isLoading
    && reports.providersQuery.isLoading
    && reports.usersQuery.isLoading;

  const onRefresh = () => {
    reports.overviewQuery.refetch();
    reports.bookingsQuery.refetch();
    reports.servicesQuery.refetch();
    reports.providersQuery.refetch();
    reports.usersQuery.refetch();
    reports.paymentsQuery.refetch();
  };

  const onExport = async () => {
    try {
      setIsExporting(true);
      const response = await adminApi.exportReports(filters);
      const blob = response?.data;
      if (!(blob instanceof Blob)) throw new Error('Invalid export payload');
      const fileUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `sewafi-report-${range}-${type}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileUrl);
      appToast.success('Report exported successfully.');
    } catch (error) {
      if (error?.response?.status === 404 || error?.response?.status === 405) setSupportsExport(false);
      appToast.error(getErrorMessage(error, 'Unable to export report right now.'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Admin"
        title="Reports"
        description="Analyze platform performance, bookings, services, providers, users, and payments."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {supportsExport ? (
              <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onExport} loading={isExporting}>
                Export Report
              </Button>
            ) : null}
          </div>
        )}
      />

      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr]">
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Date Range</span>
            <select value={range} onChange={(event) => setParam('range', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {rangeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Report Type</span>
            <select value={type} onChange={(event) => setParam('type', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {reportTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Service Category</span>
            <select value={category} onChange={(event) => setParam('category', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              <option value="all">All categories</option>
              {(Array.isArray(categoriesQuery.data) ? categoriesQuery.data : []).map((item) => (
                <option key={item?.id} value={item?.id}>{item?.name}</option>
              ))}
            </select>
          </label>
          <Input label="Search" value={search} onChange={(event) => setParam('search', event.target.value)} placeholder="Search report records..." />
        </div>
      </section>

      {anyLoading ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-24 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
          ))}
        </section>
      ) : null}

      {!anyLoading && summaryCards.length ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {summaryCards.map((card) => (
            <article key={card.label} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
              <div className="flex items-center gap-2 text-[var(--sf-text-muted)]">
                <card.icon className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">{card.label}</p>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">
                {card.money ? formatCurrency(Number(card.value || 0)) : card.value}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      {!anyLoading && !summaryCards.length ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <EmptyMessage text="This report is currently unavailable." />
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Booking Trends">
          {reports.bookingsQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-[var(--sf-surface-soft)]" />
          ) : bookingTrends.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sf-border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--sf-text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--sf-text-muted)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--sf-surface)', border: '1px solid var(--sf-border)' }} />
                  <Legend />
                  {'bookings' in bookingTrends[0] ? <Line type="monotone" dataKey="bookings" stroke="#073B73" /> : null}
                  {'completed' in bookingTrends[0] ? <Line type="monotone" dataKey="completed" stroke="#009688" /> : null}
                  {'cancelled' in bookingTrends[0] ? <Line type="monotone" dataKey="cancelled" stroke="#DC2626" /> : null}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : reports.bookingsQuery.isError ? (
            <EmptyMessage text="Unable to load this report right now." />
          ) : (
            <EmptyMessage text="Booking trend data is currently unavailable." />
          )}
        </SectionCard>

        <SectionCard title="Service Demand">
          {reports.servicesQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-[var(--sf-surface-soft)]" />
          ) : serviceDemand.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceDemand}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sf-border)" />
                  <XAxis dataKey="serviceName" tick={{ fill: 'var(--sf-text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--sf-text-muted)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--sf-surface)', border: '1px solid var(--sf-border)' }} />
                  <Legend />
                  {'count' in serviceDemand[0] ? <Bar dataKey="count" fill="#073B73" /> : null}
                  {'completed' in serviceDemand[0] ? <Bar dataKey="completed" fill="#009688" /> : null}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : reports.servicesQuery.isError ? (
            <EmptyMessage text="Unable to load this report right now." />
          ) : (
            <EmptyMessage text="Service demand data is currently unavailable." />
          )}
        </SectionCard>

        <SectionCard title="Provider Performance">
          {reports.providersQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-[var(--sf-surface-soft)]" />
          ) : providerPerformance.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--sf-surface-soft)] text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">
                  <tr>
                    <th className="px-3 py-2">Provider</th>
                    <th className="px-3 py-2">Completed</th>
                    <th className="px-3 py-2">Active</th>
                    <th className="px-3 py-2">Rating</th>
                    <th className="px-3 py-2">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {providerPerformance.map((row) => (
                    <tr key={row?.providerId || row?.id || row?.providerName} className="border-t border-[var(--sf-border)]">
                      <td className="px-3 py-2 text-[var(--sf-text-main)]">{row?.providerName || row?.provider?.name || '—'}</td>
                      <td className="px-3 py-2 text-[var(--sf-text-muted)]">{row?.completedJobs ?? '—'}</td>
                      <td className="px-3 py-2 text-[var(--sf-text-muted)]">{row?.activeJobs ?? '—'}</td>
                      <td className="px-3 py-2 text-[var(--sf-text-muted)]">{row?.rating ?? '—'}</td>
                      <td className="px-3 py-2 text-[var(--sf-text-muted)]">{row?.earnings != null ? formatCurrency(Number(row.earnings)) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : reports.providersQuery.isError ? (
            <EmptyMessage text="Unable to load this report right now." />
          ) : (
            <EmptyMessage text="Provider performance data is currently unavailable." />
          )}
        </SectionCard>

        <SectionCard title="User Growth">
          {reports.usersQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-[var(--sf-surface-soft)]" />
          ) : userGrowth.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sf-border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--sf-text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--sf-text-muted)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--sf-surface)', border: '1px solid var(--sf-border)' }} />
                  <Legend />
                  {'customers' in userGrowth[0] ? <Line type="monotone" dataKey="customers" stroke="#009688" /> : null}
                  {'providers' in userGrowth[0] ? <Line type="monotone" dataKey="providers" stroke="#073B73" /> : null}
                  {'admins' in userGrowth[0] ? <Line type="monotone" dataKey="admins" stroke="#F58220" /> : null}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : reports.usersQuery.isError ? (
            <EmptyMessage text="Unable to load this report right now." />
          ) : (
            <EmptyMessage text="User growth data is currently unavailable." />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Payment & Revenue Summary">
        {reports.paymentsQuery.isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-[var(--sf-surface-soft)]" />
        ) : hasPaymentReport ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Revenue', value: reports.paymentsQuery.data?.totalRevenue ?? reports.paymentsQuery.data?.revenue },
                { label: 'Paid Amount', value: reports.paymentsQuery.data?.paidAmount ?? reports.paymentsQuery.data?.paid },
                { label: 'Refunds', value: reports.paymentsQuery.data?.refunds ?? reports.paymentsQuery.data?.refunded },
                { label: 'Payouts', value: reports.paymentsQuery.data?.providerPayouts ?? reports.paymentsQuery.data?.payouts },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">{item.label}</p>
                  <p className="mt-1 text-lg font-bold text-[var(--sf-text-main)]">{item.value != null ? formatCurrency(Number(item.value)) : '—'}</p>
                </div>
              ))}
            </div>
            {paymentReport.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentReport}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--sf-border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--sf-text-muted)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--sf-text-muted)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--sf-surface)', border: '1px solid var(--sf-border)' }} />
                    <Legend />
                    {'revenue' in paymentReport[0] ? <Bar dataKey="revenue" fill="#009688" /> : null}
                    {'refunds' in paymentReport[0] ? <Bar dataKey="refunds" fill="#DC2626" /> : null}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </div>
        ) : reports.paymentsQuery.isError ? (
          <EmptyMessage text="Payment reports are currently unavailable." />
        ) : (
          <EmptyMessage text="Payment reports are currently unavailable." />
        )}
      </SectionCard>

      {/* TODO: Enable report export when backend export endpoint is unavailable in the current environment. */}
      {/* TODO: Add custom date picker once backend reports API supports explicit startDate/endDate parameters. */}
      {reports.overviewQuery.data?.updatedAt ? (
        <p className="text-xs text-[var(--sf-text-muted)]">Last updated: {formatDate(reports.overviewQuery.data.updatedAt, { includeTime: true })}</p>
      ) : null}
    </Container>
  );
}

export default AdminReports;
