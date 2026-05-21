import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/DataDisplay/Badge';
import { formatAuditTime, formatLabel, severityTone, statusTone, summarizeAuditLog } from './auditUtils';

export function AuditLogMobileCard({ log, onViewDetails }) {
  const actorName = log?.actor?.fullName || log?.actor?.name || log?.actor?.email || log?.actorName || 'Unknown';

  return (
    <article className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 lg:hidden">
      <p className="text-xs text-[var(--sf-text-muted)]">{formatAuditTime(log?.createdAt)}</p>
      <h3 className="mt-1 text-base font-bold text-[var(--sf-text-main)]">{formatLabel(log?.action)}</h3>
      <p className="mt-1 text-sm text-[var(--sf-text-muted)]">{actorName} - {formatLabel(log?.actorRole || 'SYSTEM')}</p>
      <p className="mt-2 text-sm text-[var(--sf-text-muted)]">{summarizeAuditLog(log)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {log?.severity ? <Badge tone={severityTone(log.severity)}>{formatLabel(log.severity)}</Badge> : null}
        {log?.status ? <Badge tone={statusTone(log.status)}>{formatLabel(log.status)}</Badge> : null}
        {log?.entityType ? <Badge tone="neutral">{formatLabel(log.entityType)}</Badge> : null}
      </div>
      <Button type="button" variant="outline" className="mt-3 h-10 w-full rounded-xl" onClick={() => onViewDetails(log)}>
        View Details
      </Button>
    </article>
  );
}

export default AuditLogMobileCard;
