import { sanitizeAuditMetadata } from './auditUtils';

export function AuditMetadataViewer({ metadata }) {
  if (!metadata || (typeof metadata === 'object' && !Object.keys(metadata).length)) {
    return <p className="text-sm text-[var(--sf-text-muted)]">No metadata available.</p>;
  }

  const normalized = typeof metadata === 'string' ? metadata : JSON.stringify(sanitizeAuditMetadata(metadata), null, 2);

  return (
    <pre className="max-h-72 overflow-auto rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3 text-xs leading-6 text-[var(--sf-text-main)]">
      {normalized}
    </pre>
  );
}

export default AuditMetadataViewer;

