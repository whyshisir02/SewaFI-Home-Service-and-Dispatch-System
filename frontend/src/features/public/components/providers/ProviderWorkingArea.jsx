import { MapPin } from 'lucide-react';
import { getProviderAreas } from './providerProfileUtils';

export function ProviderWorkingArea({ provider }) {
  const areas = getProviderAreas(provider);

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h2 className="text-lg font-bold text-[var(--sf-text-main)]">Working Area</h2>
      {areas.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {areas.map((area) => (
            <span key={area} className="inline-flex items-center gap-1 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-3 py-1 text-xs text-[var(--sf-text-main)]">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {area}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--sf-text-muted)]">Working area information is not available.</p>
      )}
    </section>
  );
}

export default ProviderWorkingArea;

