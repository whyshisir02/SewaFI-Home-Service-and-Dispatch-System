import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { ProviderDashboardHeader } from '../components/dashboard/ProviderDashboardHeader';
import { ProviderVerificationNotice } from '../components/dashboard/ProviderVerificationNotice';
import { ProviderStatsGrid } from '../components/dashboard/ProviderStatsGrid';
import { NearbyJobsSection } from '../components/dashboard/NearbyJobsSection';
import { AssignedJobsTable } from '../components/dashboard/AssignedJobsTable';
import { ProviderEarningsSummary } from '../components/dashboard/ProviderEarningsSummary';
import { ProviderNotificationsPreview } from '../components/dashboard/ProviderNotificationsPreview';
import {
  getAssignedJobs,
  getProviderProfile,
  isProviderApproved,
  isProviderAvailable,
  sortByRecent,
} from '../components/dashboard/providerDashboardUtils';
import { toArray } from '../../../utils/collection';
import { useProviderDashboardData, useProviderDashboardSocket } from '../hooks/useProviderDashboardData';
import { useBookingSocket } from '../../booking/hooks/useBookingSocket';
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

function ProviderDashboard() {
  useBookingSocket();
  useNotificationSocket();
  useProviderDashboardSocket();

  const { user } = useAuth();
  const {
    profileQuery,
    statsQuery,
    nearbyJobsQuery,
    assignedJobsQuery,
    notificationsQuery,
    availabilityMutation,
    acceptJobMutation,
    refetchProviderDashboard,
  } = useProviderDashboardData();

  const profilePayload = profileQuery.data;
  const providerProfile = getProviderProfile(profilePayload) || statsQuery.data?.profile;
  const providerStatus = providerProfile?.status;
  const approved = isProviderApproved(providerProfile);
  const available = isProviderAvailable(providerProfile);
  const nearbyJobs = toArray(nearbyJobsQuery.data, ['bookings', 'jobs']);
  const allProviderJobs = toArray(assignedJobsQuery.data, ['bookings', 'jobs']);
  const assignedJobs = getAssignedJobs(allProviderJobs, user?.id || profilePayload?.id);
  const notifications = toArray(notificationsQuery.data, ['notifications']);

  const profileFailed = profileQuery.isError && statsQuery.isError;
  const statsLoading = statsQuery.isLoading || nearbyJobsQuery.isLoading || assignedJobsQuery.isLoading;

  return (
    <Container className="space-y-8 pb-24 lg:pb-0">
      <ProviderDashboardHeader
        user={user}
        profile={profilePayload || providerProfile}
        available={available}
        availabilityLoading={availabilityMutation.isPending}
        onToggleAvailability={() => availabilityMutation.mutate({ available: !available })}
        onRefresh={refetchProviderDashboard}
      />

      {profileFailed ? (
        <SectionError title="Unable to load provider dashboard right now." onRetry={refetchProviderDashboard} />
      ) : null}

      <ProviderVerificationNotice status={providerStatus} />

      <ProviderStatsGrid
        nearbyJobs={approved ? nearbyJobs : []}
        assignedJobs={assignedJobs}
        summary={statsQuery.data}
        isLoading={statsLoading && !statsQuery.data}
      />

      <NearbyJobsSection
        jobs={nearbyJobs}
        isLoading={nearbyJobsQuery.isLoading}
        isError={nearbyJobsQuery.isError}
        available={available}
        approved={approved}
        onAccept={(id) => acceptJobMutation.mutate(id)}
        acceptingJobId={acceptJobMutation.variables}
        onRetry={() => nearbyJobsQuery.refetch()}
      />

      <AssignedJobsTable
        jobs={assignedJobs}
        isLoading={assignedJobsQuery.isLoading}
        isError={assignedJobsQuery.isError}
        onRetry={() => assignedJobsQuery.refetch()}
      />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ProviderEarningsSummary
          earnings={statsQuery.data?.earnings}
          isLoading={statsQuery.isLoading}
          isError={statsQuery.isError}
          onRetry={() => statsQuery.refetch()}
        />
        <ProviderNotificationsPreview
          notifications={sortByRecent(notifications)}
          isLoading={notificationsQuery.isLoading}
          isError={notificationsQuery.isError}
        />
      </section>
    </Container>
  );
}

export default ProviderDashboard;
