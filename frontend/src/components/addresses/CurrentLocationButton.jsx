import { LocateFixed } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { formatGeolocationError, getCurrentPosition } from '../../utils/geolocation';

export async function resolveCurrentCoordinates() {
  const position = await getCurrentPosition();
  return {
    latitude: String(position.coords.latitude),
    longitude: String(position.coords.longitude),
  };
}

export function CurrentLocationButton({ onCoordinates, onError, loading, setLoading }) {
  const handleClick = async () => {
    try {
      setLoading?.(true);
      const coordinates = await resolveCurrentCoordinates();
      onCoordinates?.(coordinates);
    } catch (error) {
      onError?.(formatGeolocationError(error));
    } finally {
      setLoading?.(false);
    }
  };

  return (
    <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={handleClick} loading={loading} disabled={loading}>
      <LocateFixed className="h-4 w-4" aria-hidden="true" />
      Use Current Location
    </Button>
  );
}

export default CurrentLocationButton;

