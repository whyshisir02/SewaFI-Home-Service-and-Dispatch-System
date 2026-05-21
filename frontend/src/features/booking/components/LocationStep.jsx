import { AddressForm } from '../../location/components/AddressForm';
import { MapLocationPicker } from '../../location/components/MapLocationPicker';
import { UseCurrentLocationButton } from '../../location/components/UseCurrentLocationButton';

export function LocationStep({ register, errors, values, onLocationChange, mapValue, onMapChange, setValue }) {
  return (
    <div className="space-y-5">
      <AddressForm register={register} errors={errors} values={values} onLocationChange={onLocationChange} />
      <UseCurrentLocationButton
        onResolved={(coords) => {
          setValue('latitude', coords.latitude);
          setValue('longitude', coords.longitude);
          onMapChange(coords);
        }}
      />
      <MapLocationPicker
        value={mapValue}
        onChange={(coords) => {
          setValue('latitude', coords.latitude);
          setValue('longitude', coords.longitude);
          onMapChange(coords);
        }}
      />
    </div>
  );
}

export default LocationStep;
