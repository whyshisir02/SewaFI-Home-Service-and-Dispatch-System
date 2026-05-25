import { ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { MapPicker } from './MapPicker';

export function MapPreview({ value, action, actionLabel = 'Open directions', height = '220px' }) {
  return (
    <div className="space-y-3">
      <MapPicker value={value} height={height} />
      {action ? (
        <Button as="a" href={action} target="_blank" rel="noreferrer" variant="outline">
          {actionLabel}
          <ExternalLink className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

export default MapPreview;
