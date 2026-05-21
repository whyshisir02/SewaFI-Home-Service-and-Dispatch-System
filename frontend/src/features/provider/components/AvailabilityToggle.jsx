import { Button } from '../../../components/ui/Button/Button';

export function AvailabilityToggle({ available, onToggle, loading }) {
  return (
    <div className="flex items-center justify-between rounded-[1.5rem] border border-border bg-surface p-4">
      <div>
        <p className="font-semibold text-foreground">Availability</p>
        <p className="text-sm text-muted">Pause or resume new nearby job requests.</p>
      </div>
      <Button variant={available ? 'secondary' : 'outline'} onClick={onToggle} loading={loading}>
        {available ? 'Available' : 'Unavailable'}
      </Button>
    </div>
  );
}

export default AvailabilityToggle;
