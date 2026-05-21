import { Link } from 'react-router-dom';
import { ArrowRight, Radar } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { Skeleton } from '../ui/Feedback/Skeleton';
import { NearbyJobCard } from './NearbyJobCard';

export function NearbyJobsSection({ jobs = [], isLoading, isError, available, approved, onAccept, acceptingJobId, onRetry }) {
  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[0_16px_40px_rgba(7,59,115,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Dispatch queue</p>
          <h2 className="mt-1 text-2xl font-extrabold text-[var(--sf-text-main)]">Nearby Jobs</h2>
        </div>
        <Button as={Link} to="/provider/jobs" variant="outline" className="rounded-xl">
          View all nearby jobs
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {!approved ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5 text-sm leading-6 text-[var(--sf-text-muted)]">
          Your provider profile is under review. You will receive job requests after approval.
        </div>
      ) : null}

      {approved && !available ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5 text-sm leading-6 text-[var(--sf-text-muted)]">
          You are currently unavailable. Turn on availability to receive nearby jobs.
        </div>
      ) : null}

      {approved && available && isLoading ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {approved && available && isError ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load nearby jobs.</p>
          <p className="mt-1 text-sm text-[var(--sf-text-muted)]">Please refresh this section and try again.</p>
          <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}

      {approved && available && !isLoading && !isError && !jobs.length ? (
        <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-8 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
            <Radar className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-2xl font-extrabold text-[var(--sf-text-main)]">No nearby jobs available right now.</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--sf-text-muted)]">
            New jobs will appear here when customers book services in your area.
          </p>
        </div>
      ) : null}

      {approved && available && jobs.length ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {jobs.slice(0, 3).map((job) => (
            <NearbyJobCard key={job.id} job={job} onAccept={onAccept} accepting={acceptingJobId === job.id} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default NearbyJobsSection;
