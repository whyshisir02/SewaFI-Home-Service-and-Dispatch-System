import { Card } from '../../../components/ui/Layout/Card';

export function SavedAddressCard({ user }) {
  return (
    <Card className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Saved address</p>
      <h3 className="text-lg font-semibold text-foreground">{user?.municipality || 'Primary address'}</h3>
      <p className="text-sm text-muted">{[user?.streetAddress, user?.ward, user?.district, user?.province].filter(Boolean).join(', ') || 'No address saved yet.'}</p>
    </Card>
  );
}

export default SavedAddressCard;
