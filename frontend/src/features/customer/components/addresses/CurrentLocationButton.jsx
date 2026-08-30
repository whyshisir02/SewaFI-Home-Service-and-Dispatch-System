import { LocateFixed } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button';
import { formatGeolocationError } from '../../../../utils/geolocation';
import { resolveCurrentCoordinates } from './currentLocation';

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

