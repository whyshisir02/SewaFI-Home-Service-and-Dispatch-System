import { Button } from '../../../components/ui/Button/Button';
import { Card } from '../../../components/ui/Layout/Card';

export function ProviderApprovalTable({ providers = [], onApprove, onReject }) {
  return (
    <Card className="space-y-4 overflow-x-auto">
      <h3 className="text-lg font-semibold text-foreground">Provider approvals</h3>
      <table className="min-w-full text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th className="py-2">Provider</th>
            <th className="py-2">Area</th>
            <th className="py-2">Category</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <tr key={provider.id} className="border-t border-border">
              <td className="py-3 text-foreground">{provider.name || provider.user?.name}</td>
              <td className="py-3 text-muted">{provider.district || provider.user?.district}</td>
              <td className="py-3 text-muted">{provider.providerProfile?.category?.name || provider.category?.name}</td>
              <td className="py-3">
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onApprove?.(provider.id || provider.userId)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onReject?.(provider.id || provider.userId)}>
                    Reject
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default ProviderApprovalTable;
