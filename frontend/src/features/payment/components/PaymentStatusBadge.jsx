import { Badge } from '../../../components/ui/DataDisplay/Badge';

const toneByStatus = {
  PAID: 'success',
  AWAITING_CONFIRMATION: 'warning',
  PENDING: 'warning',
  DISPUTED: 'danger',
  UNPAID: 'danger',
  REFUNDED: 'secondary',
  CONFIRMED: 'secondary',
};

export function PaymentStatusBadge({ status }) {
  return <Badge tone={toneByStatus[status] || 'neutral'}>{status}</Badge>;
}

export default PaymentStatusBadge;
