import { useState } from 'react';
import { Button } from '../ui/Button/Button';
import { Modal } from '../ui/Overlay/Modal';

export function CancelBookingDialog({
  open,
  onClose,
  onConfirm,
  loading,
  description = 'This will ask the backend to cancel the booking. Cancellation may fail if the booking is no longer eligible.',
}) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
  };

  return (
    <Modal open={open} onClose={onClose} title="Cancel booking">
      <p className="text-sm leading-6 text-[var(--sf-text-muted)]">
        {description}
      </p>
      <label className="mt-5 block text-sm font-bold text-[var(--sf-text-main)]">
        Reason optional
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value.slice(0, 200))}
          className="mt-2 min-h-24 w-full rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-3 text-sm text-[var(--sf-text-main)]"
          placeholder="Tell us why you are cancelling..."
        />
      </label>
      <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
        <Button type="button" variant="ghost" onClick={onClose}>
          Keep Booking
        </Button>
        <Button type="button" variant="danger" onClick={handleConfirm} loading={loading}>
          Cancel Booking
        </Button>
      </div>
    </Modal>
  );
}

export default CancelBookingDialog;
