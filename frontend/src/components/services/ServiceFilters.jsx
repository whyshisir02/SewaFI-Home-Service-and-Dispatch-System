import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { sortOptions } from './serviceOptions';

export function ServiceFilters({
  location,
  locations = [],
  sort,
  minPrice,
  maxPrice,
  onLocationChange,
  onSortChange,
  onMinPriceChange,
  onMaxPriceChange,
  onReset,
}) {
  return (
    <aside className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-[var(--sf-text-main)]">
          <SlidersHorizontal className="h-5 w-5 text-[var(--sf-secondary)]" aria-hidden="true" />
          Filters
        </h2>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-1 text-sm font-bold text-[var(--sf-secondary)] hover:underline">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="mt-6 space-y-5">
        <label className="block text-sm font-bold text-[var(--sf-text-main)]">
          Location
          <select
            value={location}
            onChange={(event) => onLocationChange(event.target.value)}
            className="mt-2 h-11 w-full rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 text-sm text-[var(--sf-text-main)]"
          >
            <option value="">All configured locations</option>
            {locations.map((item) => (
              <option key={item.id || item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-xs font-normal leading-5 text-[var(--sf-text-soft)]">
            Filter services by your preferred area.
          </span>
        </label>

        <label className="block text-sm font-bold text-[var(--sf-text-main)]">
          Sort By
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="mt-2 h-11 w-full rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 text-sm text-[var(--sf-text-main)]"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-xs font-normal leading-5 text-[var(--sf-text-soft)]">Sort results by relevance, recency, and price.</span>
        </label>

        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-[var(--sf-text-main)]">Price Range</legend>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(event) => onMinPriceChange(event.target.value)}
              className="h-11 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-3 text-sm"
              placeholder="Min"
              aria-label="Minimum price"
            />
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => onMaxPriceChange(event.target.value)}
              className="h-11 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-3 text-sm"
              placeholder="Max"
              aria-label="Maximum price"
            />
          </div>
          <p className="text-xs leading-5 text-[var(--sf-text-soft)]">Set a range that matches your expected budget.</p>
        </fieldset>

        <Button type="button" variant="outline" className="w-full rounded-xl" onClick={onReset}>
          Clear Filters
        </Button>
      </div>
    </aside>
  );
}

export default ServiceFilters;
