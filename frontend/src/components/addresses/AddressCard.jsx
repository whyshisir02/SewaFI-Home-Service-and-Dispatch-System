import { Edit, MapPin, Star, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { formatAddressDate, formatAddressText, hasCoordinates } from './addressUtils';

export function AddressCard({
  address,
  canEdit,
  canDelete,
  canSetDefault,
  settingDefault,
  onEdit,
  onDelete,
  onSetDefault,
}) {
  return (
    <article className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-[var(--sf-text-main)]">{address?.label || 'Saved Address'}</p>
          <p className="mt-1 text-sm text-[var(--sf-text-muted)]">{formatAddressText(address) || 'Address details unavailable.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {address?.isDefault ? (
            <span className="rounded-full border border-[var(--sf-secondary)]/30 bg-[var(--sf-secondary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--sf-secondary)]">
              Default
            </span>
          ) : null}
          {hasCoordinates(address) ? (
            <span className="rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-2.5 py-1 text-xs text-[var(--sf-text-muted)]">
              Coordinates available
            </span>
          ) : null}
        </div>
      </div>

      {address?.landmark ? <p className="mt-2 text-xs text-[var(--sf-text-muted)]">Landmark: {address.landmark}</p> : null}
      {address?.fullName || address?.phone ? (
        <p className="mt-2 text-xs text-[var(--sf-text-muted)]">
          {[address?.fullName, address?.phone].filter(Boolean).join(' • ')}
        </p>
      ) : null}

      {hasCoordinates(address) ? (
        <p className="mt-1 text-xs text-[var(--sf-text-muted)]">
          <MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
          {address.latitude}, {address.longitude}
        </p>
      ) : null}

      <p className="mt-2 text-xs text-[var(--sf-text-muted)]">
        Updated {formatAddressDate(address?.updatedAt || address?.createdAt)}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {canEdit ? (
          <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => onEdit(address)}>
            <Edit className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
        ) : null}
        {canSetDefault && !address?.isDefault ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            onClick={() => onSetDefault(address)}
            loading={settingDefault}
            disabled={settingDefault}
          >
            <Star className="h-4 w-4" aria-hidden="true" />
            Set Default
          </Button>
        ) : null}
        {canDelete ? (
          <Button type="button" variant="danger" className="h-10 rounded-xl" onClick={() => onDelete(address)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        ) : null}
      </div>

      {/* TODO: Show "Use for Booking" action when booking prefill with addressId is supported in booking create flow. */}
    </article>
  );
}

export default AddressCard;

