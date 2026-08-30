import { MapPin, Search } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';

export function ServiceSearchBar({ search, location, locations = [], locationsLoading, onSearchChange, onLocationChange, onSubmit }) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow)]"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_0.42fr_auto]">
        <label className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-3 text-sm font-bold text-[var(--sf-text-main)] focus-within:border-[var(--sf-secondary)]">
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
            Search Services
          </span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search for a service e.g. Plumbing, Cleaning..."
            className="h-8 w-full border-none bg-transparent text-sm text-[var(--sf-text-main)] placeholder:text-[var(--sf-text-soft)] outline-none"
            aria-label="Search for a service"
          />
        </label>

        <label className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-3 text-sm font-bold text-[var(--sf-text-main)] focus-within:border-[var(--sf-secondary)]">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
            Location
          </span>
          <select
            value={location}
            onChange={(event) => onLocationChange(event.target.value)}
            className="h-8 w-full border-none bg-transparent text-sm text-[var(--sf-text-main)] outline-none"
            aria-label="Select your location"
          >
            <option value="">{locationsLoading ? 'Loading locations...' : 'Select your location'}</option>
            {locations.map((item) => (
              <option key={item.id || item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <Button type="submit" className="min-h-12 rounded-2xl bg-[var(--sf-accent)] px-7 text-white hover:brightness-95 lg:min-h-full">
          Search Services
        </Button>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--sf-text-soft)]">
        Your selected filters stay active on this page until you clear them.
      </p>
    </form>
  );
}

export default ServiceSearchBar;
