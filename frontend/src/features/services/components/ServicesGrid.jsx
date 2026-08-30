import { Filter } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { ServiceCard } from './ServiceCard';
import { sortOptions } from './serviceOptions';

export function ServicesGrid({
  services = [],
  isLoading,
  isError,
  count,
  sort,
  onSortChange,
  onRetry,
  onClearFilters,
  onOpenFilters,
}) {
  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--sf-text-main)]">Services Found</h2>
          <p className="mt-1 text-sm text-[var(--sf-text-muted)]">
            {isLoading ? 'Loading services...' : `${count ?? services.length} ${count === 1 ? 'Service' : 'Services'} Found`}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" className="rounded-xl lg:hidden" onClick={onOpenFilters}>
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filters
          </Button>
          <label className="flex items-center gap-3 text-sm font-bold text-[var(--sf-text-main)]">
            Sort
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value)}
              className="h-11 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-3 text-sm text-[var(--sf-text-main)]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : null}

      {isError ? (
        <EmptyState
          title="Unable to load services"
          description="Unable to load services right now."
          actionLabel="Retry"
          onAction={onRetry}
        />
      ) : null}

      {!isLoading && !isError && !services.length ? (
        <EmptyState
          title="No services found"
          description="No services found for your filters."
          actionLabel="Clear filters"
          onAction={onClearFilters}
        />
      ) : null}

      {!isLoading && !isError && services.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default ServicesGrid;
