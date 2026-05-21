import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button/Button';

export function AddressesHeader({ onRefresh, onAdd, canAdd, refreshing }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--sf-text-main)] sm:text-4xl">Saved Addresses</h1>
        <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
          Manage service locations used for booking and provider dispatch.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        {canAdd ? (
          <Button type="button" className="h-11 rounded-xl bg-[var(--sf-secondary)] text-white hover:brightness-95" onClick={onAdd}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Address
          </Button>
        ) : null}
        <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </Button>
      </div>
    </header>
  );
}

export default AddressesHeader;

