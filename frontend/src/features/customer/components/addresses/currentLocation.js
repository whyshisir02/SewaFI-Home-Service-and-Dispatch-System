import { getCurrentPosition } from '../../../../utils/geolocation';

export async function resolveCurrentCoordinates() {
  const position = await getCurrentPosition();
  return {
    latitude: String(position.coords.latitude),
    longitude: String(position.coords.longitude),
  };
}
