import { Drawer } from '../../ui/Overlay/Drawer';
import { Modal } from '../../ui/Overlay/Modal';
import { Badge } from '../../ui/DataDisplay/Badge';
import { formatAuditTime, formatLabel, severityTone, statusTone } from './auditUtils';
import { AuditMetadataViewer } from './AuditMetadataViewer';

function Section({ title, children }) {
  return (
    <section className="space-y-2 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
      <h4 className="text-sm font-semibold text-[var(--sf-text-main)]">{title}</h4>
      <div className="space-y-1 text-sm text-[var(--sf-text-muted)]">{children}</div>
    </section>
  );
}

const Value = ({ label, value }) => (
  <p>
    <span className="font-semibold text-[var(--sf-text-main)]">{label}:</span> {value || 'N/A'}
  </p>
);

export function AuditLogDetailsDialog({ open, onClose, log, isDesktop }) {
  const ContentWrapper = isDesktop ? Modal : Drawer;

  return (
    <ContentWrapper open={open} onClose={onClose} title="Audit Log Details">
      {!log ? <p className="text-sm text-[var(--sf-text-muted)]">Log details unavailable.</p> : (
        <div className="space-y-3">
          <Section title="Overview">
            <Value label="Action" value={formatLabel(log?.action)} />
            <Value label="Time" value={formatAuditTime(log?.createdAt)} />
            <div className="flex flex-wrap gap-2">
              {log?.severity ? <Badge tone={severityTone(log.severity)}>{formatLabel(log.severity)}</Badge> : null}
              {log?.status ? <Badge tone={statusTone(log.status)}>{formatLabel(log.status)}</Badge> : null}
            </div>
          </Section>

          <Section title="Actor">
            <Value label="Name" value={log?.actor?.fullName || log?.actor?.name || log?.actorName} />
            <Value label="Email" value={log?.actor?.email} />
            <Value label="Role" value={log?.actorRole ? formatLabel(log.actorRole) : 'System'} />
            <Value label="Actor ID" value={log?.actorId} />
          </Section>

          <Section title="Target / Entity">
            <Value label="Entity Type" value={log?.entityType ? formatLabel(log.entityType) : null} />
            <Value label="Entity ID" value={log?.entityId} />
            <Value label="Booking Code" value={log?.bookingCode} />
            <Value label="Target User" value={log?.targetUser?.fullName || log?.targetUser?.name || log?.targetUserId} />
            <Value label="Provider" value={log?.provider?.fullName || log?.provider?.name || log?.providerId} />
          </Section>

          <Section title="Technical Context">
            <Value label="IP Address" value={log?.ipAddress} />
            <Value label="User Agent" value={log?.userAgent} />
          </Section>

          <Section title="Metadata">
            <AuditMetadataViewer metadata={log?.metadata} />
          </Section>
        </div>
      )}
    </ContentWrapper>
  );
}

export default AuditLogDetailsDialog;
