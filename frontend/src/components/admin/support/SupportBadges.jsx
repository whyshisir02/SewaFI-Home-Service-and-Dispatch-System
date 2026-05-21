import StatusBadge from '../../common/StatusBadge';
import { Badge } from '../../ui/DataDisplay/Badge';
import { priorityLabel, toUpperUnderscore, topicLabel } from './supportUtils';

const priorityTone = {
  LOW: 'neutral',
  MEDIUM: 'primary',
  HIGH: 'warning',
  URGENT: 'danger',
};

const topicTone = {
  BOOKING_SUPPORT: 'primary',
  PROVIDER_REGISTRATION: 'success',
  ACCOUNT_HELP: 'secondary',
  PAYMENT_ISSUE: 'warning',
  SERVICE_ISSUE: 'warning',
  GENERAL_QUESTION: 'neutral',
};

export function SupportStatusBadge({ status }) {
  return <StatusBadge status={toUpperUnderscore(status)} />;
}

export function SupportPriorityBadge({ priority }) {
  const key = toUpperUnderscore(priority);
  return (
    <Badge tone={priorityTone[key] || 'neutral'}>
      {priorityLabel(priority)}
    </Badge>
  );
}

export function SupportTopicBadge({ topic }) {
  const key = toUpperUnderscore(topic);
  return (
    <Badge tone={topicTone[key] || 'neutral'}>
      {topicLabel(topic)}
    </Badge>
  );
}

