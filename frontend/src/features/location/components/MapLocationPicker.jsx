import { MapPicker } from '../../../components/common/MapPicker';

export function MapLocationPicker({ value, onChange }) {
  return <MapPicker value={value} onSelect={onChange} height="320px" />;
}

export default MapLocationPicker;
