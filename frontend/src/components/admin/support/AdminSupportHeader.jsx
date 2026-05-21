import { Download, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/Button/Button';

export function AdminSupportHeader({ onRefresh, onExport, supportsExport, exporting }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--sf-text-main)] sm:text-4xl">Support</h1>
        <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
          Review customer messages, provider issues, booking help requests, and contact form submissions.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {supportsExport ? (
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onExport} loading={exporting} disabled={exporting}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        ) : null}
        <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>
    </header>
  );
}

export default AdminSupportHeader;

