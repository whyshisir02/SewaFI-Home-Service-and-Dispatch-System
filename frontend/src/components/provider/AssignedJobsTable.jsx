import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CalendarClock } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { Skeleton } from '../ui/Feedback/Skeleton';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { getAmount, getJobDate, getLocationSummary, getServiceName, sortByRecent } from './providerDashboardUtils';

const Amount = ({ job }) => {
  const amount = getAmount(job);
  if (!amount) return <span>Not available</span>;
  return <span>{amount.label === 'Estimated' ? 'Est. ' : ''}{formatCurrency(amount.value)}</span>;
};

export function AssignedJobsTable({ jobs = [], isLoading, isError, onRetry }) {
  const assignedJobs = sortByRecent(jobs).slice(0, 5);

  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[0_16px_40px_rgba(7,59,115,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Work board</p>
          <h2 className="mt-1 text-2xl font-extrabold text-[var(--sf-text-main)]">Assigned Jobs</h2>
        </div>
        <Button as={Link} to="/provider/jobs" variant="outline" className="rounded-xl">
          View all assigned jobs
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load assigned jobs.</p>
          <p className="mt-1 text-sm text-[var(--sf-text-muted)]">Please refresh this section and try again.</p>
          <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && !assignedJobs.length ? (
        <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-8 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]">
            <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-2xl font-extrabold text-[var(--sf-text-main)]">No assigned jobs yet.</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--sf-text-muted)]">
            Accepted and in-progress jobs will appear here.
          </p>
        </div>
      ) : null}

      {!isLoading && !isError && assignedJobs.length ? (
        <>
          <div className="mt-6 hidden overflow-hidden rounded-2xl border border-[var(--sf-border)] lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--sf-surface-soft)] text-xs uppercase tracking-[0.16em] text-[var(--sf-text-muted)]">
                <tr>
                  <th className="px-4 py-4 font-semibold">Job / Booking Code</th>
                  <th className="px-4 py-4 font-semibold">Service</th>
                  <th className="px-4 py-4 font-semibold">Customer Area</th>
                  <th className="px-4 py-4 font-semibold">Date & Time</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Amount</th>
                  <th className="px-4 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sf-border)]">
                {assignedJobs.map((job) => {
                  const jobDate = getJobDate(job);
                  return (
                    <tr key={job.id} className="text-[var(--sf-text-muted)]">
                      <td className="px-4 py-4">{job.bookingCode || job.id}</td>
                      <td className="px-4 py-4 font-semibold text-[var(--sf-text-main)]">{getServiceName(job)}</td>
                      <td className="px-4 py-4">{getLocationSummary(job)}</td>
                      <td className="px-4 py-4">{jobDate ? formatDate(jobDate, { includeTime: true }) : 'Not scheduled'}</td>
                      <td className="px-4 py-4"><StatusBadge status={job.status} /></td>
                      <td className="px-4 py-4"><Amount job={job} /></td>
                      <td className="px-4 py-4">
                        <Link className="font-semibold text-[var(--sf-secondary)] hover:underline" to={`/provider/jobs/${job.id}`}>
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-3 lg:hidden">
            {assignedJobs.map((job) => {
              const jobDate = getJobDate(job);
              return (
                <article key={job.id} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-[var(--sf-text-main)]">{getServiceName(job)}</h3>
                      <p className="mt-1 text-xs text-[var(--sf-text-muted)]">{job.bookingCode || job.id}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-[var(--sf-text-muted)]">
                    <p className="flex gap-2">
                      <CalendarClock className="mt-0.5 h-4 w-4 text-[var(--sf-secondary)]" />
                      {jobDate ? formatDate(jobDate, { includeTime: true }) : 'Not scheduled'}
                    </p>
                    <p>{getLocationSummary(job)}</p>
                    <p>Amount: <Amount job={job} /></p>
                  </div>
                  <Button as={Link} to={`/provider/jobs/${job.id}`} variant="outline" className="mt-4 w-full rounded-xl">
                    View Details
                  </Button>
                </article>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}

export default AssignedJobsTable;
