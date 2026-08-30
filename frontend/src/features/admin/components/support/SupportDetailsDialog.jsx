import { Link } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button/Button';
import { Modal } from '../../../../components/ui/Overlay/Modal';
import { Drawer } from '../../../../components/ui/Overlay/Drawer';
import { ROUTES } from '../../../../constants/routes.constant';
import { SupportPriorityBadge, SupportStatusBadge, SupportTopicBadge } from './SupportBadges';
import { formatSupportDate } from './supportUtils';
import SupportReplyBox from './SupportReplyBox';

function DetailsContent({
  message,
  supportsReply,
  supportsStatus,
  supportsArchive,
  supportsDelete,
  onSetInProgress,
  onResolve,
  onArchive,
  onDelete,
  onReply,
  replying,
}) {
  const replies = Array.isArray(message?.replies) ? message.replies : [];

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3 text-sm">
        <p className="font-semibold text-[var(--sf-text-main)]">{message?.subject || 'No subject'}</p>
        <p className="mt-1 text-xs text-[var(--sf-text-muted)]">{message?.ticketCode}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <SupportStatusBadge status={message?.status} />
          {message?.priority ? <SupportPriorityBadge priority={message.priority} /> : null}
          {message?.topic ? <SupportTopicBadge topic={message.topic} /> : null}
        </div>
        <p className="mt-2 text-xs text-[var(--sf-text-muted)]">Created: {formatSupportDate(message?.createdAt)}</p>
      </section>

      <section className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3 text-sm">
        <h3 className="font-semibold text-[var(--sf-text-main)]">Sender</h3>
        <p className="mt-1 text-[var(--sf-text-main)]">{message?.fullName || '--'}</p>
        <p className="text-[var(--sf-text-muted)]">{message?.email || '--'}</p>
        {message?.phone ? <p className="text-[var(--sf-text-muted)]">{message.phone}</p> : null}
        {message?.role ? <p className="text-xs text-[var(--sf-text-muted)]">{message.role}</p> : null}
      </section>

      <section className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3 text-sm">
        <h3 className="font-semibold text-[var(--sf-text-main)]">Message</h3>
        <p className="mt-2 whitespace-pre-wrap text-[var(--sf-text-main)]">{message?.message || '--'}</p>
      </section>

      {message?.bookingId ? (
        <section className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3 text-sm">
          <h3 className="font-semibold text-[var(--sf-text-main)]">Related Booking</h3>
          <Link
            to={ROUTES.admin.bookingDetails.replace(':id', String(message.bookingId))}
            className="mt-1 inline-block text-[var(--sf-primary)] hover:underline"
          >
            {message?.bookingCode || message.bookingId}
          </Link>
        </section>
      ) : null}

      {replies.length ? (
        <section className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3 text-sm">
          <h3 className="font-semibold text-[var(--sf-text-main)]">Replies</h3>
          <div className="mt-2 space-y-2">
            {replies.map((reply, index) => (
              <article key={reply?.id || index} className="rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface)] p-2">
                <p className="text-[var(--sf-text-main)]">{reply?.message || reply?.content || '--'}</p>
                <p className="mt-1 text-xs text-[var(--sf-text-muted)]">{formatSupportDate(reply?.createdAt)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {supportsStatus || supportsArchive || supportsDelete ? (
        <section className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
          <h3 className="text-sm font-semibold text-[var(--sf-text-main)]">Actions</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {supportsStatus ? (
              <>
                <Button type="button" variant="outline" className="h-9 rounded-xl px-3" onClick={() => onSetInProgress(message)}>
                  Mark In Progress
                </Button>
                <Button type="button" variant="outline" className="h-9 rounded-xl px-3" onClick={() => onResolve(message)}>
                  Mark Resolved
                </Button>
              </>
            ) : null}
            {supportsArchive ? (
              <Button type="button" variant="outline" className="h-9 rounded-xl px-3" onClick={() => onArchive(message)}>
                Archive
              </Button>
            ) : null}
            {supportsDelete ? (
              <Button type="button" variant="danger" className="h-9 rounded-xl px-3" onClick={() => onDelete(message)}>
                Delete
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {supportsReply ? (
        <section className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
          <h3 className="mb-2 text-sm font-semibold text-[var(--sf-text-main)]">Reply</h3>
          <SupportReplyBox onSubmit={onReply} loading={replying} />
        </section>
      ) : null}
    </div>
  );
}

export function SupportDetailsDialog({
  open,
  onClose,
  message,
  isDesktop,
  supportsReply,
  supportsStatus,
  supportsArchive,
  supportsDelete,
  onSetInProgress,
  onResolve,
  onArchive,
  onDelete,
  onReply,
  replying,
}) {
  if (!message) return null;

  if (isDesktop) {
    return (
      <Modal open={open} onClose={onClose} title="Support Message Details">
        <DetailsContent
          message={message}
          supportsReply={supportsReply}
          supportsStatus={supportsStatus}
          supportsArchive={supportsArchive}
          supportsDelete={supportsDelete}
          onSetInProgress={onSetInProgress}
          onResolve={onResolve}
          onArchive={onArchive}
          onDelete={onDelete}
          onReply={onReply}
          replying={replying}
        />
      </Modal>
    );
  }

  return (
    <Drawer open={open} onClose={onClose} title="Support Message Details">
      <DetailsContent
        message={message}
        supportsReply={supportsReply}
        supportsStatus={supportsStatus}
        supportsArchive={supportsArchive}
        supportsDelete={supportsDelete}
        onSetInProgress={onSetInProgress}
        onResolve={onResolve}
        onArchive={onArchive}
        onDelete={onDelete}
        onReply={onReply}
        replying={replying}
      />
    </Drawer>
  );
}

export default SupportDetailsDialog;
