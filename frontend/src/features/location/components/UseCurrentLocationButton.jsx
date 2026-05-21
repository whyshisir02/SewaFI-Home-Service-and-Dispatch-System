import { LocateFixed } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { useGeolocation } from '../../../hooks/useGeolocation';

export function UseCurrentLocationButton({ onResolved }) {
  const { getCurrentLocation, latitude, longitude, loading } = useGeolocation();

  useEffect(() => {
    if (latitude && longitude) {
      onResolved?.({ latitude, longitude });
    }
  }, [latitude, longitude, onResolved]);

  return (
    <Button type="button" variant="outline" onClick={getCurrentLocation} loading={loading}>
      <LocateFixed className="h-4 w-4" />
      Use my current location
    </Button>
  );
}

export default UseCurrentLocationButton;
