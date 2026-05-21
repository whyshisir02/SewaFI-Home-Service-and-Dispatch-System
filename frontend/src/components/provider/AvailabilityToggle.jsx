import { Power } from 'lucide-react';
import { cn } from '../../lib/cn';

export function AvailabilityToggle({ available, loading, onToggle, disabled }) {
  return (
    <button
      type="button"
      aria-pressed={available}
      aria-label={`Provider availability is ${available ? 'available' : 'unavailable'}`}
      disabled={disabled || loading}
      onClick={onToggle}
      className={cn(
        'inline-flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[var(--sf-secondary)] disabled:cursor-not-allowed disabled:opacity-60',
        available
          ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]'
          : 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-muted)]'
      )}
    >
      <span className="inline-flex items-center gap-2">
        <Power className="h-4 w-4" aria-hidden="true" />
        {loading ? 'Updating...' : available ? 'Available' : 'Unavailable'}
      </span>
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition',
          available ? 'bg-[var(--sf-secondary)]' : 'bg-[var(--sf-border)]'
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'absolute top-1 h-4 w-4 rounded-full bg-white transition',
            available ? 'left-6' : 'left-1'
          )}
        />
      </span>
    </button>
  );
}

export default AvailabilityToggle;
