import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { toLatLng } from '../../utils/mapHelpers';

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect?.({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });
  return null;
}

export function MapPicker({ value, onSelect, height = '300px' }) {
  const center = toLatLng(value);

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border">
      <MapContainer center={center} zoom={13} style={{ height, width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <Marker position={center} />
        <MapClickHandler onSelect={onSelect} />
      </MapContainer>
    </div>
  );
}

export default MapPicker;
