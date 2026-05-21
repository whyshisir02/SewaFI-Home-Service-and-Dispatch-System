import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/DataDisplay/Badge';
import {
  actionCategoryFromLog,
  formatAuditTime,
  formatLabel,
  severityTone,
  statusTone,
  summarizeAuditLog,
} from './auditUtils';

export function AuditLogsTable({ logs, onViewDetails }) {
  return (
    <section className="hidden overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] lg:block">
      <table className="w-full text-left">
        <thead className="bg-[var(--sf-surface-soft)]">
          <tr className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Entity</th>
            <th className="px-4 py-3">Status/Severity</th>
            <th className="px-4 py-3">Summary</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const actorName = log?.actor?.fullName || log?.actor?.name || log?.actor?.email || log?.actorName || 'Unknown';
            const actorRole = log?.actorRole ? formatLabel(log.actorRole) : 'System';
            const actionCategory = actionCategoryFromLog(log);

            return (
              <tr key={log?.id} className="border-t border-[var(--sf-border)] align-top">
                <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{formatAuditTime(log?.createdAt)}</td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-[var(--sf-text-main)]">{formatLabel(log?.action)}</p>
                  <Badge tone="primary" className="mt-1">{formatLabel(actionCategory)}</Badge>
                </td>
                <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                  <p>{actorName}</p>
                  <p className="text-xs">{actorRole}</p>
                </td>
                <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                  <p>{log?.entityType ? formatLabel(log.entityType) : 'N/A'}</p>
                  <p className="text-xs">{log?.bookingCode || log?.entityId || 'N/A'}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {log?.severity ? <Badge tone={severityTone(log.severity)}>{formatLabel(log.severity)}</Badge> : null}
                    {log?.status ? <Badge tone={statusTone(log.status)}>{formatLabel(log.status)}</Badge> : null}
                    {!log?.severity && !log?.status ? <span className="text-sm text-[var(--sf-text-muted)]">N/A</span> : null}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{summarizeAuditLog(log)}</td>
                <td className="px-4 py-4">
                  <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => onViewDetails(log)}>
                    View Details
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default AuditLogsTable;
