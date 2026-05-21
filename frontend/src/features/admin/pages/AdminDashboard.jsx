import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { AdminDashboardHeader } from '../../../components/admin/AdminDashboardHeader';
import { AdminKpiGrid } from '../../../components/admin/AdminKpiGrid';
import { BookingActivityChart } from '../../../components/admin/BookingActivityChart';
import { ServiceDistributionChart } from '../../../components/admin/ServiceDistributionChart';
import { RecentBookingsTable } from '../../../components/admin/RecentBookingsTable';
import { ProviderApprovalQueue } from '../../../components/admin/ProviderApprovalQueue';
import { RecentUsersProvidersPanel } from '../../../components/admin/RecentUsersProvidersPanel';
import { SystemAlertsPanel } from '../../../components/admin/SystemAlertsPanel';
import { toArray } from '../../../components/admin/adminDashboardUtils';
import { useAdminDashboardData } from '../../../hooks/useAdminDashboard';
import { useNotificationSocket } from '../../notification/hooks/useNotificationSocket';

function SectionError({ title, onRetry }) {
  return (
    <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <p className="font-semibold text-[var(--sf-text-main)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--sf-text-muted)]">Please refresh this section or try again shortly.</p>
      {onRetry ? (
        <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

function AdminDashboard() {
  useNotificationSocket();

  const { user } = useAuth();
  const {
    statsQuery,
    revenueChartQuery,
    categoryChartQuery,
    recentBookingsQuery,
    pendingProvidersQuery,
    recentUsersQuery,
    notificationsQuery,
    approveProviderMutation,
    refreshAdminDashboard,
  } = useAdminDashboardData();

  const recentBookings = toArray(recentBookingsQuery.data, ['bookings']);
  const pendingProviders = toArray(pendingProvidersQuery.data, ['providers']);
  const recentUsers = toArray(recentUsersQuery.data, ['users']);
  const notifications = toArray(notificationsQuery.data, ['notifications']);
  const revenueChart = toArray(revenueChartQuery.data, ['items']);
  const categoryChart = toArray(categoryChartQuery.data, ['items']);

  return (
    <Container className="space-y-8 pb-24 lg:pb-0">
      <AdminDashboardHeader user={user} onRefresh={refreshAdminDashboard} />

      {statsQuery.isError ? (
        <SectionError title="Unable to load dashboard stats." onRetry={() => statsQuery.refetch()} />
      ) : null}

      <AdminKpiGrid stats={statsQuery.data} isLoading={statsQuery.isLoading} />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <BookingActivityChart
          data={revenueChart}
          isLoading={revenueChartQuery.isLoading}
          isError={revenueChartQuery.isError}
          onRetry={() => revenueChartQuery.refetch()}
        />
        <ServiceDistributionChart
          data={categoryChart}
          isLoading={categoryChartQuery.isLoading}
          isError={categoryChartQuery.isError}
          onRetry={() => categoryChartQuery.refetch()}
        />
      </section>

      <RecentBookingsTable
        bookings={recentBookings}
        isLoading={recentBookingsQuery.isLoading}
        isError={recentBookingsQuery.isError}
        onRetry={() => recentBookingsQuery.refetch()}
      />

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <ProviderApprovalQueue
          providers={pendingProviders}
          isLoading={pendingProvidersQuery.isLoading}
          isError={pendingProvidersQuery.isError}
          approvingId={approveProviderMutation.variables}
          onApprove={(id) => approveProviderMutation.mutate(id)}
          onRetry={() => pendingProvidersQuery.refetch()}
        />
        <RecentUsersProvidersPanel
          users={recentUsers}
          isLoading={recentUsersQuery.isLoading}
          isError={recentUsersQuery.isError}
        />
      </section>

      <SystemAlertsPanel
        alerts={notifications}
        isLoading={notificationsQuery.isLoading}
        isError={notificationsQuery.isError}
      />
    </Container>
  );
}

export default AdminDashboard;
