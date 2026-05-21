import { ConfirmDialog } from '../ui/Overlay/ConfirmDialog';

export function DeleteAddressDialog({ open, onClose, onConfirm, loading }) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Address?"
      description="This saved address will be removed from your account. Existing bookings will not be changed."
      confirmLabel={loading ? 'Deleting...' : 'Delete Address'}
    />
  );
}

export default DeleteAddressDialog;

