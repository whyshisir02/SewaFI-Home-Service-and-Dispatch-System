import { Input } from '../../../components/ui/Input/Input';
import { LocationSelector } from './LocationSelector';

export function AddressForm({ register, values, onLocationChange, errors }) {
  return (
    <div className="space-y-4">
      <LocationSelector values={values} onChange={onLocationChange} />
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Ward" error={errors.ward?.message} {...register('ward')} />
        <Input label="Landmark" error={errors.landmark?.message} {...register('landmark')} />
      </div>
      <Input label="Address" error={errors.address?.message} {...register('address')} />
    </div>
  );
}

export default AddressForm;
