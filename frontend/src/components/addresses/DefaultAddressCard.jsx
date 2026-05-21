import { Home } from 'lucide-react';
import { formatAddressText } from './addressUtils';

export function DefaultAddressCard({ address }) {
  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <div className="flex items-center gap-2">
        <Home className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
        <h2 className="text-base font-bold text-[var(--sf-text-main)]">Default Service Address</h2>
      </div>

      {address ? (
        <div className="mt-3 space-y-1">
          {address?.label ? <p className="text-sm font-semibold text-[var(--sf-text-main)]">{address.label}</p> : null}
          <p className="text-sm text-[var(--sf-text-muted)]">{formatAddressText(address) || 'Address details unavailable.'}</p>
          {address?.landmark ? <p className="text-xs text-[var(--sf-text-muted)]">Landmark: {address.landmark}</p> : null}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
          <p className="text-sm font-medium text-[var(--sf-text-main)]">No default address selected.</p>
          <p className="mt-1 text-xs text-[var(--sf-text-muted)]">Set a default address from your saved addresses.</p>
        </div>
      )}
    </section>
  );
}

export default DefaultAddressCard;

