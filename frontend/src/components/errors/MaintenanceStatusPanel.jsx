import { Clock, Server } from 'lucide-react';

const toArray = (value) => (Array.isArray(value) ? value : []);

const toReadableTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

export function MaintenanceStatusPanel({ statusData, loading }) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
        <p className="text-sm text-[var(--sf-text-muted)]">Checking maintenance status...</p>
      </section>
    );
  }

  if (!statusData) return null;

  const message = statusData?.message;
  const estimatedRestoreAt = toReadableTime(statusData?.estimatedRestoreAt);
  const updatedAt = toReadableTime(statusData?.updatedAt);
  const affectedServices = toArray(statusData?.affectedServices);

  if (!message && !estimatedRestoreAt && !updatedAt && !affectedServices.length) return null;

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h2 className="text-lg font-bold text-[var(--sf-text-main)]">Maintenance Status</h2>
      {message ? <p className="mt-2 text-sm text-[var(--sf-text-muted)]">{message}</p> : null}

      {estimatedRestoreAt ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--sf-text-main)]">
          <Clock className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
          Estimated restore: {estimatedRestoreAt}
        </p>
      ) : null}

      {updatedAt ? (
        <p className="mt-2 text-xs text-[var(--sf-text-muted)]">Last updated: {updatedAt}</p>
      ) : null}

      {affectedServices.length ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-[var(--sf-text-main)]">Affected services</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {affectedServices.map((item, index) => {
              const name = typeof item === 'string' ? item : item?.name || item?.service || '';
              const serviceStatus = typeof item === 'string' ? '' : item?.status || '';
              return (
                <li key={`${name}-${index}`} className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3 text-sm text-[var(--sf-text-main)]">
                  <p className="inline-flex items-center gap-2 font-medium">
                    <Server className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
                    {name || 'Service'}
                  </p>
                  {serviceStatus ? <p className="mt-1 text-xs text-[var(--sf-text-muted)]">Status: {serviceStatus}</p> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default MaintenanceStatusPanel;
