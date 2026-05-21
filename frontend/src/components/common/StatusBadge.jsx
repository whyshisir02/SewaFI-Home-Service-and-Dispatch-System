import { Badge } from '../ui/DataDisplay/Badge';

const STATUS_META = {
  PENDING: { label: 'Pending', tone: 'warning' },
  PROVIDER_SEARCHING: { label: 'Provider Searching', tone: 'warning' },
  NEW_REQUEST: { label: 'New Request', tone: 'primary' },
  ACCEPTED: { label: 'Accepted', tone: 'secondary' },
  PROVIDER_ACCEPTED: { label: 'Provider Accepted', tone: 'secondary' },
  IN_PROGRESS: { label: 'In Progress', tone: 'warning' },
  WORK_IN_PROGRESS: { label: 'Work In Progress', tone: 'warning' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  PAYMENT_DISPUTED: { label: 'Payment Disputed', tone: 'danger' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
  PENDING_APPROVAL: { label: 'Pending Approval', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  SUSPENDED: { label: 'Suspended', tone: 'danger' },
  ADMIN: { label: 'Admin', tone: 'primary' },
  CUSTOMER: { label: 'Customer', tone: 'neutral' },
  PROVIDER: { label: 'Provider', tone: 'secondary' },
  PAID: { label: 'Paid', tone: 'success' },
  AWAITING_CONFIRMATION: { label: 'Awaiting Customer Confirmation', tone: 'warning' },
  DISPUTED: { label: 'Disputed', tone: 'danger' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
  CANCELLATION_FEE: { label: 'Cancellation Fee', tone: 'warning' },
  FAILED: { label: 'Failed', tone: 'danger' },
  PROCESSING: { label: 'Processing', tone: 'primary' },
  CASH_PENDING: { label: 'Cash Pending', tone: 'warning' },
  UNPAID: { label: 'Unpaid', tone: 'danger' },
  ACTIVE: { label: 'Active', tone: 'success' },
  INACTIVE: { label: 'Inactive', tone: 'neutral' },
  VERIFIED: { label: 'Verified', tone: 'success' },
  UNVERIFIED: { label: 'Unverified', tone: 'warning' },
  EMAIL_UNVERIFIED: { label: 'Email Unverified', tone: 'warning' },
};

const formatStatus = (status) =>
  String(status || 'Unknown')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export function StatusBadge({ status, className }) {
  const meta = STATUS_META[status] || { label: formatStatus(status), tone: 'neutral' };
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export default StatusBadge;
