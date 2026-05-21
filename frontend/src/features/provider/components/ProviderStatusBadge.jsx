import { Badge } from '../../../components/ui/DataDisplay/Badge';

const toneByStatus = {
  APPROVED: 'success',
  PENDING_APPROVAL: 'warning',
  REJECTED: 'danger',
};

export function ProviderStatusBadge({ status }) {
  return <Badge tone={toneByStatus[status] || 'neutral'}>{status || 'Unknown'}</Badge>;
}

export default ProviderStatusBadge;
