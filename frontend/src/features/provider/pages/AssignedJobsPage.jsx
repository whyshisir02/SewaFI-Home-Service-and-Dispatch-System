import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/ui/Overlay/Modal';
import { Drawer } from '../../../components/ui/Overlay/Drawer';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { formatDate } from '../../../utils/formatDate';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getErrorMessage } from '../../../utils/errorHandler';
import {
  getBookingCoordinates,
  getBookingMapsAction,
} from '../../../utils/bookingLocation';
import { appToast } from '../../../lib/toast';
import { ROUTES } from '../../../constants/routes.constant';
import { getBookingDisplayStatus } from '../../../constants/booking-status.constant';
import { toArray } from '../../../components/provider/providerDashboardUtils';
import { useAssignedJobs } from '../hooks/useAssignedJobs';
import { providerApi } from '../api/provider.api';
import { BookingStatusBadge } from '../../booking/components/BookingStatusBadge';

const dateOptions = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'scheduled', label: 'Scheduled first' },
];

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const getServiceName = (job) => job?.service?.name || job?.serviceName || 'Service request';
const getArea = (job) =>
  job?.addressStreet ||
  job?.address ||
  job?.streetAddress ||
  job?.areaLabel ||
  job?.location?.area ||
  [
    job?.addressMunicipality || job?.municipality,
    job?.addressDistrict || job?.district,
    job?.addressProvince || job?.province,
  ]
    .filter(Boolean)
    .join(', ') ||
  'Area unavailable';
const getDate = (job) => job?.scheduledTime || job?.scheduledAt || job?.preferredDate || job?.createdAt;
const getAmount = (job) =>
  job?.finalAmount ??
  job?.providerProposedAmount ??
  job?.finalPrice ??
  job?.estimatedAmount ??
  job?.estimatedPrice ??
  job?.totalPrice ??
  null;

const isInRange = (dateValue, range) => {
  if (!dateValue || range === 'all') return true;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  if (range === 'today') return date.toDateString() === now.toDateString();
  if (range === 'week') {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    return date >= now && date <= weekEnd;
  }
  if (range === 'month') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  return true;
};

const sortJobs = (jobs, sort) => {
  if (sort === 'oldest') return [...jobs].sort((a, b) => new Date(getDate(a) || 0) - new Date(getDate(b) || 0));
  if (sort === 'scheduled')
    return [...jobs].sort((a, b) => new Date(a?.scheduledTime || a?.scheduledAt || a?.preferredDate || Infinity) - new Date(b?.scheduledTime || b?.scheduledAt || b?.preferredDate || Infinity));
  return [...jobs].sort((a, b) => new Date(getDate(b) || 0) - new Date(getDate(a) || 0));
};

function JobActions({ job, onStart, onComplete, loadingId }) {
  const displayStatus = getBookingDisplayStatus(job, { audience: 'provider' });

  if (job?.status === 'ACCEPTED') {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-9 rounded-xl"
        onClick={() => onStart(job)}
        loading={loadingId === job.id}
        disabled={loadingId === job.id}
      >
        Start Work
      </Button>
    );
  }
  if (job?.status === 'IN_PROGRESS') {
    if (displayStatus.code === 'AWAITING_CONFIRMATION') {
      return (
        <Button type="button" variant="outline" className="h-9 rounded-xl" disabled>
          Waiting for Customer Confirmation
        </Button>
      );
    }
    return (
      <Button
        type="button"
        className="h-9 rounded-xl"
        onClick={() => onComplete(job)}
        loading={loadingId === job.id}
        disabled={loadingId === job.id}
      >
        Complete Work & Submit Final Amount
      </Button>
    );
  }
  return null;
}

function AssignedJobsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedJob, setSelectedJob] = useState(null);
  const [finalAmountJob, setFinalAmountJob] = useState(null);
  const [loadingJobId, setLoadingJobId] = useState(null);
  const [finalAmount, setFinalAmount] = useState('');
  const [providerNote, setProviderNote] = useState('');
  const [submittingFinalAmount, setSubmittingFinalAmount] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const date = searchParams.get('date') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      ...(search ? { search } : {}),
      ...(status !== 'all' ? { status } : {}),
      ...(date !== 'all' ? { date } : {}),
      ...(sort !== 'newest' ? { sort } : {}),
    }),
    [date, page, search, sort, status]
  );

  const { providerStatus, approved, assignedJobsQuery, updateStatusMutation } = useAssignedJobs(filters);
  const assignedJobs = toArray(assignedJobsQuery.data, ['bookings', 'jobs']);
  const assignedMeta = assignedJobsQuery.data?.meta;

  const filteredJobs = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return sortJobs(
      assignedJobs.filter((job) => {
        if (status !== 'all' && job?.status !== status) return false;
        if (!isInRange(getDate(job), date)) return false;
        if (!needle) return true;
        const haystack = `${job?.bookingCode || ''} ${getServiceName(job)} ${getArea(job)}`.toLowerCase();
        return haystack.includes(needle);
      }),
      sort
    );
  }, [assignedJobs, date, search, sort, status]);
  const currentPage = Number(assignedMeta?.page || page || 1);
  const totalPages = Number(assignedMeta?.totalPages || 1);

  const stats = useMemo(() => {
    const active = assignedJobs.filter((job) => ['ACCEPTED', 'IN_PROGRESS'].includes(job?.status)).length;
    const completed = assignedJobs.filter((job) => job?.status === 'COMPLETED').length;
    const cancelled = assignedJobs.filter((job) => job?.status === 'CANCELLED').length;
    const today = assignedJobs.filter((job) => isInRange(getDate(job), 'today')).length;
    const earningsValues = assignedJobs
      .map((job) => getAmount(job))
      .filter((value) => value !== null && value !== undefined)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    const earnings = earningsValues.length ? earningsValues.reduce((sum, value) => sum + value, 0) : null;
    return { active, completed, cancelled, today, earnings };
  }, [assignedJobs]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === 'newest') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const updateStatus = async (job, nextStatus) => {
    if (!job?.id) return;
    setLoadingJobId(job.id);
    try {
      await updateStatusMutation.mutateAsync({ id: job.id, status: nextStatus });
      appToast.success(nextStatus === 'IN_PROGRESS' ? 'Work started successfully.' : 'Job status updated successfully.');
      assignedJobsQuery.refetch();
      if (selectedJob?.id === job.id) {
        setSelectedJob((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      }
    } catch (error) {
      appToast.error(getErrorMessage(error, 'This job status cannot be updated right now.'));
    } finally {
      setLoadingJobId(null);
      setFinalAmountJob(null);
    }
  };

  const onSubmitFinalAmount = async () => {
    if (!finalAmountJob?.id) return;
    const amountNumber = Number(finalAmount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      appToast.error('Please enter a valid final amount.');
      return;
    }

    setSubmittingFinalAmount(true);
    try {
      await providerApi.submitFinalAmount({
        bookingId: finalAmountJob.id,
        finalAmount: amountNumber,
        providerNote: providerNote.trim() || undefined,
      });
      appToast.success('Final amount submitted. Waiting for customer confirmation.');
      setFinalAmountJob(null);
      setFinalAmount('');
      setProviderNote('');
      queryClient.invalidateQueries({ queryKey: ['provider-assigned-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      assignedJobsQuery.refetch();
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to submit final amount right now.'));
    } finally {
      setSubmittingFinalAmount(false);
    }
  };

  const selectedJobCoordinates = getBookingCoordinates(selectedJob);
  const selectedJobMapAction = getBookingMapsAction(selectedJob);

  const detailsPanel = selectedJob ? (
    <div className="space-y-3 text-sm text-[var(--sf-text-muted)]">
      {selectedJobMapAction?.url ? (
        <div className="pb-1">
          <Button as="a" href={selectedJobMapAction.url} target="_blank" rel="noreferrer" variant="outline" className="h-9 rounded-xl">
            {selectedJobMapAction.label}
          </Button>
        </div>
      ) : null}
      <p><span className="font-semibold text-[var(--sf-text-main)]">Booking:</span> #{selectedJob.bookingCode || selectedJob.id}</p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Service:</span> {getServiceName(selectedJob)}</p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Status:</span> <BookingStatusBadge booking={selectedJob} audience="provider" className="ml-2" /></p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Service location:</span> {getArea(selectedJob)}</p>
      {selectedJob?.addressLandmark ? <p><span className="font-semibold text-[var(--sf-text-main)]">Landmark:</span> {selectedJob.addressLandmark}</p> : null}
      {(selectedJob?.contactName || selectedJob?.customer?.name) ? (
        <p><span className="font-semibold text-[var(--sf-text-main)]">Contact name:</span> {selectedJob?.contactName || selectedJob?.customer?.name}</p>
      ) : null}
      {(selectedJob?.contactPhone || selectedJob?.customer?.phone) ? (
        <p><span className="font-semibold text-[var(--sf-text-main)]">Contact phone:</span> {selectedJob?.contactPhone || selectedJob?.customer?.phone}</p>
      ) : null}
      {selectedJobCoordinates ? (
        <p><span className="font-semibold text-[var(--sf-text-main)]">GPS:</span> Location captured</p>
      ) : (
        <p>GPS location was not captured. Use the written address and contact the customer if needed.</p>
      )}
      {!selectedJobMapAction ? (
        <p>Location is not available for this booking.</p>
      ) : null}
      <p><span className="font-semibold text-[var(--sf-text-main)]">Date:</span> {formatDate(getDate(selectedJob), { includeTime: true })}</p>
      {selectedJob?.description ? <p><span className="font-semibold text-[var(--sf-text-main)]">Description:</span> {selectedJob.description}</p> : null}
      {selectedJob?.specialInstructions ? <p><span className="font-semibold text-[var(--sf-text-main)]">Instructions:</span> {selectedJob.specialInstructions}</p> : null}
      {getAmount(selectedJob) != null ? <p><span className="font-semibold text-[var(--sf-text-main)]">Amount:</span> {formatCurrency(getAmount(selectedJob))}</p> : null}
      {selectedJob?.paymentStatus ? <p><span className="font-semibold text-[var(--sf-text-main)]">Payment:</span> {selectedJob.paymentStatus}</p> : null}
      <div className="pt-2">
        <JobActions
          job={selectedJob}
          onStart={(job) => updateStatus(job, 'IN_PROGRESS')}
          onComplete={setFinalAmountJob}
          loadingId={loadingJobId}
        />
      </div>
    </div>
  ) : null;

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Provider Jobs"
        title="Assigned Jobs"
        description="Manage accepted, in-progress, completed, and cancelled service jobs."
        actions={
          <>
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => assignedJobsQuery.refetch()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button as={Link} to={ROUTES.provider.nearbyJobs} variant="outline" className="h-11 rounded-xl">
              Nearby Jobs
            </Button>
          </>
        }
      />

      {!approved ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Your provider profile must be approved before you can manage assigned jobs.</p>
          <div className="mt-3 flex items-center gap-3">
            <StatusBadge status={providerStatus || 'PENDING_APPROVAL'} />
            <Button as={Link} to={ROUTES.provider.profile} variant="outline" className="rounded-xl">
              View Profile
            </Button>
          </div>
        </section>
      ) : null}

      {approved ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: 'Active Jobs', value: stats.active, icon: BriefcaseBusiness },
              { label: 'Completed Jobs', value: stats.completed, icon: CheckCircle2 },
              { label: 'Cancelled Jobs', value: stats.cancelled, icon: XCircle },
              { label: "Today's Jobs", value: stats.today, icon: CalendarDays },
              { label: 'Earnings', value: stats.earnings == null ? 'N/A' : formatCurrency(stats.earnings), icon: Clock3 },
            ].map((item) => (
              <article key={item.label} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                <div className="flex items-center gap-2 text-[var(--sf-text-muted)]">
                  <item.icon className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.12em]">{item.label}</p>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">{item.value}</p>
                <p className="mt-1 text-xs text-[var(--sf-text-muted)]">From loaded jobs</p>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr]">
              <label className="space-y-2 text-sm font-medium text-[var(--sf-text-main)]">
                <span>Search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setParam('search', event.target.value)}
                  placeholder="Search by booking code, service, or customer area..."
                  className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-[var(--sf-text-main)]">
                <span>Status</span>
                <select
                  value={status}
                  onChange={(event) => setParam('status', event.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-[var(--sf-text-main)]">
                <span>Date</span>
                <select
                  value={date}
                  onChange={(event) => setParam('date', event.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
                >
                  {dateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-[var(--sf-text-main)]">
                <span>Sort</span>
                <select
                  value={sort}
                  onChange={(event) => setParam('sort', event.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-3 text-xs text-[var(--sf-text-muted)]">
              Starting/base price is an estimate. Submit final amount after site inspection and completed work.
            </p>
          </section>

          {assignedJobsQuery.isLoading ? (
            <section className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
              ))}
            </section>
          ) : null}

          {!assignedJobsQuery.isLoading && assignedJobsQuery.isError ? (
            <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <p className="font-semibold text-[var(--sf-text-main)]">Unable to load assigned jobs right now.</p>
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => assignedJobsQuery.refetch()}>
                  Retry
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => assignedJobsQuery.refetch()}>
                  Refresh
                </Button>
              </div>
            </section>
          ) : null}

          {!assignedJobsQuery.isLoading && !assignedJobsQuery.isError && !assignedJobs.length ? (
            <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
              <p className="text-lg font-semibold text-[var(--sf-text-main)]">No assigned jobs yet.</p>
              <p className="mt-2 text-sm text-[var(--sf-text-muted)]">Accepted jobs will appear here after you accept nearby service requests.</p>
              <Button as={Link} to={ROUTES.provider.nearbyJobs} className="mt-4 rounded-xl">
                View Nearby Jobs
              </Button>
            </section>
          ) : null}

          {!assignedJobsQuery.isLoading && !assignedJobsQuery.isError && assignedJobs.length && !filteredJobs.length ? (
            <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
              <p className="text-lg font-semibold text-[var(--sf-text-main)]">No jobs found for these filters.</p>
              <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => setSearchParams(new URLSearchParams())}>
                Clear Filters
              </Button>
            </section>
          ) : null}

          {!assignedJobsQuery.isLoading && !assignedJobsQuery.isError && filteredJobs.length ? (
            <>
              <section className="hidden overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] lg:block">
                <table className="w-full text-left">
                  <thead className="bg-[var(--sf-surface-soft)]">
                    <tr className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">
                      <th className="px-4 py-3">Job</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Service Location</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => (
                      <tr key={job?.id} className="border-t border-[var(--sf-border)]">
                        <td className="px-4 py-4 text-sm font-semibold text-[var(--sf-text-main)]">#{job?.bookingCode || job?.id}</td>
                        <td className="px-4 py-4 text-sm text-[var(--sf-text-main)]">{getServiceName(job)}</td>
                        <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{getArea(job)}</td>
                        <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{formatDate(getDate(job), { includeTime: true })}</td>
                        <td className="px-4 py-4 text-sm"><BookingStatusBadge booking={job} audience="provider" /></td>
                        <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{getAmount(job) == null ? 'Not available' : formatCurrency(getAmount(job))}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setSelectedJob(job)}>
                              View Details
                            </Button>
                            <JobActions
                              job={job}
                              onStart={(item) => updateStatus(item, 'IN_PROGRESS')}
                              onComplete={setFinalAmountJob}
                              loadingId={loadingJobId}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="space-y-3 lg:hidden">
                {filteredJobs.map((job) => (
                  <article key={job?.id} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--sf-text-main)]">#{job?.bookingCode || job?.id}</p>
                        <p className="text-sm text-[var(--sf-text-muted)]">{getServiceName(job)}</p>
                      </div>
                      <BookingStatusBadge booking={job} audience="provider" />
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-[var(--sf-text-muted)]">
                      <p>{getArea(job)}</p>
                      <p>{formatDate(getDate(job), { includeTime: true })}</p>
                      <p>{getAmount(job) == null ? 'Amount unavailable' : formatCurrency(getAmount(job))}</p>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setSelectedJob(job)}>
                        View Details
                      </Button>
                      <JobActions
                        job={job}
                        onStart={(item) => updateStatus(item, 'IN_PROGRESS')}
                        onComplete={setFinalAmountJob}
                        loadingId={loadingJobId}
                      />
                    </div>
                  </article>
                ))}
              </section>
              {totalPages > 1 ? (
                <section className="flex items-center justify-between rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-3">
                  <p className="text-sm text-[var(--sf-text-muted)]">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
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
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {isDesktop ? (
        <Modal open={Boolean(selectedJob)} onClose={() => setSelectedJob(null)} title={selectedJob ? getServiceName(selectedJob) : 'Assigned job details'}>
          {detailsPanel}
        </Modal>
      ) : (
        <Drawer open={Boolean(selectedJob)} onClose={() => setSelectedJob(null)} title={selectedJob ? getServiceName(selectedJob) : 'Assigned job details'}>
          {detailsPanel}
        </Drawer>
      )}

      <Modal
        open={Boolean(finalAmountJob)}
        onClose={() => {
          setFinalAmountJob(null);
          setFinalAmount('');
          setProviderNote('');
        }}
        title="Submit Final Amount"
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--sf-text-muted)]">
            Starting/base price: {getAmount(finalAmountJob) == null ? 'Not available' : formatCurrency(getAmount(finalAmountJob))}
          </p>
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
            <span>Work Note</span>
            <textarea
              rows={4}
              value={providerNote}
              onChange={(event) => setProviderNote(event.target.value)}
              className="w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 py-2 text-sm text-[var(--sf-text-main)]"
              placeholder="Describe what was completed."
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="h-10 rounded-xl"
              onClick={onSubmitFinalAmount}
              loading={submittingFinalAmount}
              disabled={submittingFinalAmount}
            >
              Submit Final Amount
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => {
                setFinalAmountJob(null);
                setFinalAmount('');
                setProviderNote('');
              }}
              disabled={submittingFinalAmount}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

    </Container>
  );
}

export default AssignedJobsPage;
