import { Search } from 'lucide-react';

const DATE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'This week' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'nearest', label: 'Nearest first' },
  { value: 'highest_estimate', label: 'Highest estimate' },
];

export function NearbyJobsFilters({
  search = '',
  service = 'all',
  date = 'all',
  sort = 'newest',
  serviceOptions = [],
  canSortByNearest = false,
  canSortByEstimate = false,
  onSearchChange,
  onServiceChange,
  onDateChange,
  onSortChange,
}) {
  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr_0.7fr_0.7fr]">
        <label className="space-y-2 text-sm font-medium text-[var(--sf-text-main)]">
          <span>Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sf-text-muted)]" />
            <input
              type="text"
              className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] pl-9 pr-3 text-sm text-[var(--sf-text-main)] outline-none focus:border-[var(--sf-secondary)]"
              value={search}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search by service, booking code, or area..."
            />
          </div>
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--sf-text-main)]">
          <span>Service</span>
          <select
            className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
            value={service}
            onChange={(event) => onServiceChange?.(event.target.value)}
          >
            <option value="all">All services</option>
            {serviceOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--sf-text-main)]">
          <span>Date</span>
          <select
            className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
            value={date}
            onChange={(event) => onDateChange?.(event.target.value)}
          >
            {DATE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--sf-text-main)]">
          <span>Sort</span>
          <select
            className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
            value={sort}
            onChange={(event) => onSortChange?.(event.target.value)}
          >
            {SORT_OPTIONS.filter((item) => {
              if (item.value === 'nearest') return canSortByNearest;
              if (item.value === 'highest_estimate') return canSortByEstimate;
              return true;
            }).map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

export default NearbyJobsFilters;
