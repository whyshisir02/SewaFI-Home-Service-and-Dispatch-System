import { Download, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../common/PageHeader';
import { Button } from '../../ui/Button/Button';

export function AdminAuditLogsHeader({ onRefresh, onExport, supportsExport, exportLoading }) {
  return (
    <PageHeader
      eyebrow="Admin"
      title="Audit Logs"
      description="Review important admin actions, booking changes, provider decisions, and system activity."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {supportsExport ? (
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onExport} loading={exportLoading}>
              <Download className="h-4 w-4" />
              Export Logs
            </Button>
          ) : null}
        </div>
      )}
    />
  );
}

export default AdminAuditLogsHeader;

