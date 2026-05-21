import { Button } from '../Button/Button';
import { Modal } from './Modal';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmLoading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-muted">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={confirmLoading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={confirmLoading} disabled={confirmLoading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
