import { Link } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button/Button';
import { ROUTES } from '../../../../constants/routes.constant';
import { formatSupportDate } from './supportUtils';
import { SupportPriorityBadge, SupportStatusBadge, SupportTopicBadge } from './SupportBadges';

export function SupportMessageCard({
  message,
  onViewDetails,
  onSetInProgress,
  onResolve,
  supportsStatus,
  showTopic,
  showPriority,
}) {
  return (
    <article className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 lg:hidden">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[var(--sf-text-main)]">{message?.subject || 'No subject'}</p>
          <p className="text-xs text-[var(--sf-text-muted)]">{message?.ticketCode}</p>
        </div>
        <SupportStatusBadge status={message?.status} />
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-[var(--sf-text-muted)]">{message?.message || '--'}</p>

      <div className="mt-3 space-y-1 text-xs text-[var(--sf-text-muted)]">
        <p>{message?.fullName || '--'} {message?.email ? `- ${message.email}` : ''}</p>
        <p>{formatSupportDate(message?.createdAt)}</p>
        {message?.bookingId ? (
          <Link
            to={ROUTES.admin.bookingDetails.replace(':id', String(message.bookingId))}
            className="text-[var(--sf-primary)] hover:underline"
          >
            {message?.bookingCode || message.bookingId}
          </Link>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {showTopic ? <SupportTopicBadge topic={message?.topic} /> : null}
        {showPriority ? <SupportPriorityBadge priority={message?.priority} /> : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => onViewDetails(message)}>
          View
        </Button>
        {supportsStatus ? (
          <>
            <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => onSetInProgress(message)}>
              In Progress
            </Button>
            <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => onResolve(message)}>
              Resolve
            </Button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export default SupportMessageCard;
