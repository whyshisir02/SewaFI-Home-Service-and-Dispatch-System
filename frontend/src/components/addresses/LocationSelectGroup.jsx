import { Select } from '../ui/Input/Select';

export function LocationSelectGroup({
  values,
  errors,
  provinceOptions,
  districtOptions,
  municipalityOptions,
  loadingProvinces,
  loadingDistricts,
  loadingMunicipalities,
  onChange,
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select
        label="Province"
        value={values.province}
        onChange={(event) => onChange('province', event.target.value)}
        error={errors.province}
        disabled={loadingProvinces}
        options={provinceOptions}
        placeholder={loadingProvinces ? 'Loading provinces...' : 'Select province'}
      />
      <Select
        label="District"
        value={values.district}
        onChange={(event) => onChange('district', event.target.value)}
        error={errors.district}
        disabled={!values.province || loadingDistricts}
        options={districtOptions}
        placeholder={loadingDistricts ? 'Loading districts...' : 'Select district'}
      />
      <Select
        label="Municipality"
        value={values.municipality}
        onChange={(event) => onChange('municipality', event.target.value)}
        error={errors.municipality}
        disabled={!values.district || loadingMunicipalities}
        options={municipalityOptions}
        placeholder={loadingMunicipalities ? 'Loading municipalities...' : 'Select municipality'}
      />
    </div>
  );
}

export default LocationSelectGroup;

