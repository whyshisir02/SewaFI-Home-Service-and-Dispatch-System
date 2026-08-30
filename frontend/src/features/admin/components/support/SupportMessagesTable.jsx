import { Link } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button/Button';
import { ROUTES } from '../../../../constants/routes.constant';
import { formatSupportDate } from './supportUtils';
import { SupportPriorityBadge, SupportStatusBadge, SupportTopicBadge } from './SupportBadges';

export function SupportMessagesTable({
  messages,
  onViewDetails,
  onSetInProgress,
  onResolve,
  supportsStatus,
  showPriority,
  showTopic,
}) {
  return (
    <section className="hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] lg:block">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--sf-surface-soft)] text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">
            <tr>
              <th className="px-4 py-3">Ticket / Message</th>
              <th className="px-4 py-3">Sender</th>
              {showTopic ? <th className="px-4 py-3">Topic</th> : null}
              <th className="px-4 py-3">Related Booking</th>
              <th className="px-4 py-3">Status</th>
              {showPriority ? <th className="px-4 py-3">Priority</th> : null}
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((item) => (
              <tr key={item?.id || item?.ticketCode} className="border-t border-[var(--sf-border)] align-top">
                <td className="px-4 py-4">
                  <p className="font-semibold text-[var(--sf-text-main)]">{item?.subject || 'No subject'}</p>
                  <p className="text-xs text-[var(--sf-text-muted)]">{item?.ticketCode}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--sf-text-muted)]">{item?.message || '--'}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-[var(--sf-text-main)]">{item?.fullName || '--'}</p>
                  <p className="text-xs text-[var(--sf-text-muted)]">{item?.email || item?.phone || '--'}</p>
                  {item?.role ? <p className="text-xs text-[var(--sf-text-muted)]">{item.role}</p> : null}
                </td>
                {showTopic ? (
                  <td className="px-4 py-4">
                    <SupportTopicBadge topic={item?.topic} />
                  </td>
                ) : null}
                <td className="px-4 py-4">
                  {item?.bookingId ? (
                    <Link
                      to={ROUTES.admin.bookingDetails.replace(':id', String(item.bookingId))}
                      className="text-[var(--sf-primary)] hover:underline"
                    >
                      {item?.bookingCode || item.bookingId}
                    </Link>
                  ) : (
                    <span className="text-[var(--sf-text-muted)]">--</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <SupportStatusBadge status={item?.status} />
                </td>
                {showPriority ? (
                  <td className="px-4 py-4">
                    <SupportPriorityBadge priority={item?.priority} />
                  </td>
                ) : null}
                <td className="px-4 py-4 text-xs text-[var(--sf-text-muted)]">{formatSupportDate(item?.createdAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" className="h-9 rounded-xl px-3" onClick={() => onViewDetails(item)}>
                      View
                    </Button>
                    {supportsStatus ? (
                      <>
                        <Button type="button" variant="outline" className="h-9 rounded-xl px-3" onClick={() => onSetInProgress(item)}>
                          In Progress
                        </Button>
                        <Button type="button" variant="outline" className="h-9 rounded-xl px-3" onClick={() => onResolve(item)}>
                          Resolve
                        </Button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default SupportMessagesTable;
