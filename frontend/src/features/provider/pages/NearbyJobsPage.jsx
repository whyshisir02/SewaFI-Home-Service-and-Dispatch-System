import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { appToast } from '../../../lib/toast';
import { ROUTES } from '../../../constants/routes.constant';
import { ROLES } from '../../../constants/roles.constant';
import { useAuth } from '../../../context/AuthContext';
import { getErrorMessage } from '../../../utils/errorHandler';
import { toArray } from '../../../components/provider/providerDashboardUtils';
import { NearbyJobsFilters } from '../components/NearbyJobsFilters';
import { NearbyJobsJobCard } from '../components/NearbyJobsJobCard';
import { NearbyJobDetailsDialog } from '../components/NearbyJobDetailsDialog';
import { ProviderAvailabilityNotice } from '../components/ProviderAvailabilityNotice';
import { useNearbyJobs } from '../hooks/useNearbyJobs';

const dateRangeMatchers = {
  today: (value) => {
    const now = new Date();
    const date = new Date(value);
    return date.toDateString() === now.toDateString();
  },
  tomorrow: (value) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = new Date(value);
    return date.toDateString() === tomorrow.toDateString();
  },
  week: (value) => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    const date = new Date(value);
    return date >= now && date <= nextWeek;
  },
};

const getServiceName = (job) => job?.service?.name || job?.serviceName || '';
const getArea = (job) => job?.areaLabel || job?.location?.area || [job?.municipality, job?.district, job?.province].filter(Boolean).join(', ');
const getDateSource = (job) => job?.preferredDate || job?.scheduledAt || job?.createdAt;
const dashboardByRole = {
  [ROLES.CUSTOMER]: ROUTES.customer.dashboard,
  [ROLES.PROVIDER]: ROUTES.provider.dashboard,
  [ROLES.ADMIN]: ROUTES.admin.dashboard,
};

function NearbyJobsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedJob, setSelectedJob] = useState(null);
  const [acceptingJobId, setAcceptingJobId] = useState(null);
  const [decliningJobId, setDecliningJobId] = useState(null);

  const queryState = {
    search: searchParams.get('search') || '',
    service: searchParams.get('service') || 'all',
    date: searchParams.get('date') || 'all',
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page') || 1),
  };

  const backendFilters = useMemo(
    () => ({
      page: queryState.page,
      limit: 20,
      ...(queryState.search ? { search: queryState.search } : {}),
      ...(queryState.service !== 'all' ? { service: queryState.service } : {}),
      ...(queryState.date !== 'all' ? { date: queryState.date } : {}),
      ...(queryState.sort !== 'newest' ? { sort: queryState.sort } : {}),
    }),
    [queryState.date, queryState.page, queryState.search, queryState.service, queryState.sort]
  );

  const {
    profileQuery,
    nearbyJobsQuery,
    acceptJobMutation,
    rejectJobMutation,
    availabilityMutation,
    providerStatus,
    approved,
    available,
    hasSelectedServices,
  } = useNearbyJobs(backendFilters);

  const nearbyJobs = toArray(nearbyJobsQuery.data, ['bookings', 'jobs']);
  const nearbyMeta = nearbyJobsQuery.data?.meta;
  const servicesFromJobs = useMemo(() => {
    const seen = new Map();
    for (const job of nearbyJobs) {
      const id = String(job?.service?.id || job?.serviceId || getServiceName(job));
      if (!id || seen.has(id)) continue;
      seen.set(id, { value: id, label: getServiceName(job) || 'Service request' });
    }
    return Array.from(seen.values());
  }, [nearbyJobs]);
  const hasDistanceInResults = nearbyJobs.some((job) => job?.distanceKm != null);
  const hasEstimateInResults = nearbyJobs.some((job) => job?.estimatedPrice != null || job?.totalPrice != null);

  const filteredJobs = useMemo(() => {
    const searchTerm = queryState.search.trim().toLowerCase();

    const byFilter = nearbyJobs.filter((job) => {
      if (queryState.service !== 'all') {
        const serviceId = String(job?.service?.id || job?.serviceId || getServiceName(job));
        if (serviceId !== queryState.service) return false;
      }

      if (queryState.date !== 'all') {
        const source = getDateSource(job);
        if (!source) return false;
        const matchByDate = dateRangeMatchers[queryState.date];
        if (matchByDate && !matchByDate(source)) return false;
      }

      if (!searchTerm) return true;
      const text = `${getServiceName(job)} ${job?.bookingCode || ''} ${getArea(job) || ''}`.toLowerCase();
      return text.includes(searchTerm);
    });

    if (queryState.sort === 'oldest') {
      return [...byFilter].sort((a, b) => new Date(getDateSource(a) || 0) - new Date(getDateSource(b) || 0));
    }
    if (queryState.sort === 'nearest') {
      return [...byFilter].sort((a, b) => Number(a?.distanceKm ?? Infinity) - Number(b?.distanceKm ?? Infinity));
    }
    if (queryState.sort === 'highest_estimate') {
      return [...byFilter].sort((a, b) => Number(b?.estimatedPrice ?? 0) - Number(a?.estimatedPrice ?? 0));
    }
    return [...byFilter].sort((a, b) => new Date(getDateSource(b) || 0) - new Date(getDateSource(a) || 0));
  }, [nearbyJobs, queryState.date, queryState.search, queryState.service, queryState.sort]);
  const currentPage = Number(nearbyMeta?.page || queryState.page || 1);
  const totalPages = Number(nearbyMeta?.totalPages || 1);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === 'newest') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const onAcceptJob = async (job) => {
    const jobId = job?.id;
    if (!jobId) return;
    setAcceptingJobId(jobId);
    try {
      const response = await acceptJobMutation.mutateAsync(jobId);
      appToast.success('Job accepted successfully.');
      setSelectedJob(null);
      const acceptedId = response?.id || response?.booking?.id || jobId;
      navigate(ROUTES.provider.jobDetails.replace(':id', String(acceptedId)));
    } catch (error) {
      const status = error?.response?.status;
      const message = String(error?.response?.data?.message || error?.message || '');

      if (status === 409) {
        appToast.error('This job is no longer available.');
      } else if (
        status === 403 &&
        (message.toLowerCase().includes('category mismatch') ||
          message.toLowerCase().includes('approved services'))
      ) {
        appToast.error('This job does not match your approved services.');
      } else {
        appToast.error(getErrorMessage(error, 'Unable to accept job right now. Please try again.'));
      }
      nearbyJobsQuery.refetch();
    } finally {
      setAcceptingJobId(null);
    }
  };

  const onToggleAvailability = async (nextAvailable) => {
    try {
      await availabilityMutation.mutateAsync({ available: nextAvailable });
      appToast.success(nextAvailable ? 'Availability turned on.' : 'Availability turned off.');
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to update availability right now.'));
    }
  };

  const onDeclineJob = async (job) => {
    const jobId = job?.id;
    if (!jobId) return;

    setDecliningJobId(jobId);
    try {
      await rejectJobMutation.mutateAsync(jobId);
      appToast.success('Job declined.');
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
      }
      nearbyJobsQuery.refetch();
    } catch (error) {
      if (error?.response?.status === 409) {
        appToast.error('This job is no longer available.');
      } else {
        appToast.error(getErrorMessage(error, 'Unable to decline this job right now.'));
      }
      nearbyJobsQuery.refetch();
    } finally {
      setDecliningJobId(null);
    }
  };

  if (user?.role && user.role !== ROLES.PROVIDER) {
    return (
      <Container className="space-y-6 py-6 lg:py-8">
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">Only providers can access nearby jobs.</p>
          <p className="mt-2 text-sm text-[var(--sf-text-muted)]">Use your dashboard to continue with available actions for your role.</p>
          <Button as={Link} to={dashboardByRole[user?.role] || ROUTES.home} className="mt-4 rounded-xl">
            Go to Dashboard
          </Button>
        </section>
      </Container>
    );
  }

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Provider Jobs"
        title="Nearby Jobs"
        description="View available service requests that match your skills, working area, and availability."
        actions={
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => nearbyJobsQuery.refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh Jobs
          </Button>
        }
      />

      <ProviderAvailabilityNotice
        approved={approved}
        available={available}
        status={providerStatus}
        onToggleAvailability={onToggleAvailability}
        toggleLoading={availabilityMutation.isPending}
      />

      {approved && !hasSelectedServices ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
          <p className="font-semibold text-[var(--sf-text-main)]">Please select the services you provide to receive matching jobs.</p>
          <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
            Nearby jobs are matched by your selected services inside your approved category.
          </p>
          <Button as={Link} to={ROUTES.provider.verification} variant="outline" className="mt-4 rounded-xl">
            Update Service Selection
          </Button>
        </section>
      ) : null}

      {approved ? (
        <>
          {hasSelectedServices ? (
            <NearbyJobsFilters
              search={queryState.search}
              service={queryState.service}
              date={queryState.date}
              sort={queryState.sort}
              serviceOptions={servicesFromJobs}
              canSortByNearest={hasDistanceInResults}
              canSortByEstimate={hasEstimateInResults}
              onSearchChange={(value) => setParam('search', value)}
              onServiceChange={(value) => setParam('service', value)}
              onDateChange={(value) => setParam('date', value)}
              onSortChange={(value) => setParam('sort', value)}
            />
          ) : null}

          {!available ? (
            <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
              <p className="font-semibold text-[var(--sf-text-main)]">You are currently unavailable.</p>
              <p className="mt-2 text-sm text-[var(--sf-text-muted)]">Turn on availability to receive nearby job requests.</p>
            </section>
          ) : null}

          {available && hasSelectedServices && nearbyJobsQuery.isLoading ? (
            <section className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
              ))}
            </section>
          ) : null}

          {available && hasSelectedServices && !nearbyJobsQuery.isLoading && nearbyJobsQuery.isError ? (
            <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
              <p className="font-semibold text-[var(--sf-text-main)]">Unable to load nearby jobs right now.</p>
              <p className="mt-1 text-sm text-[var(--sf-text-muted)]">Try refreshing to load the latest available requests.</p>
              <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => nearbyJobsQuery.refetch()}>
                Retry
              </Button>
            </section>
          ) : null}

          {available && hasSelectedServices && !nearbyJobsQuery.isLoading && !nearbyJobsQuery.isError && !filteredJobs.length ? (
            <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
              <p className="text-lg font-semibold text-[var(--sf-text-main)]">No nearby jobs available right now.</p>
              <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
                New jobs will appear here when customers book matching services in your area.
              </p>
              {(queryState.search || queryState.service !== 'all' || queryState.date !== 'all') ? (
                <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => setSearchParams(new URLSearchParams())}>
                  Clear filters
                </Button>
              ) : null}
            </section>
          ) : null}

          {available && hasSelectedServices && filteredJobs.length ? (
            <>
              <section className="grid gap-4 lg:grid-cols-2">
                {filteredJobs.map((job) => (
                  <NearbyJobsJobCard
                    key={job?.id}
                    job={job}
                    onViewDetails={setSelectedJob}
                    onAccept={onAcceptJob}
                    onDecline={onDeclineJob}
                    accepting={acceptingJobId === job?.id}
                    declining={decliningJobId === job?.id}
                  />
                ))}
              </section>
              <div className="flex items-center justify-between rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-3">
                <div className="space-y-1">
                  <p className="text-sm text-[var(--sf-text-muted)]">
                    Showing {filteredJobs.length} jobs from current results.
                  </p>
                  {totalPages > 1 ? (
                    <p className="text-xs text-[var(--sf-text-muted)]">
                      Page {currentPage} of {totalPages}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {totalPages > 1 ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-xl"
                        disabled={currentPage <= 1}
                        onClick={() => setParam('page', String(Math.max(1, currentPage - 1)))}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-xl"
                        disabled={currentPage >= totalPages}
                        onClick={() => setParam('page', String(Math.min(totalPages, currentPage + 1)))}
                      >
                        Next
                      </Button>
                    </>
                  ) : null}
                  <StatusBadge status={providerStatus || 'APPROVED'} />
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : null}

      <NearbyJobDetailsDialog
        open={Boolean(selectedJob)}
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onAccept={onAcceptJob}
        onDecline={onDeclineJob}
        accepting={acceptingJobId === selectedJob?.id}
        declining={decliningJobId === selectedJob?.id}
      />

      {profileQuery.isError ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
          <p className="text-sm text-[var(--sf-danger)]">Unable to load provider profile state. Nearby jobs availability may be limited.</p>
        </section>
      ) : null}
    </Container>
  );
}

export default NearbyJobsPage;
