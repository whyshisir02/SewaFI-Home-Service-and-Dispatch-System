import { ConfirmDialog } from '../../ui/Overlay/ConfirmDialog';

export function SupportActionDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
}) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
    />
  );
}

export default SupportActionDialog;

