import { Select } from '../../../components/ui/Input/Select';
import { useDistricts, useMunicipalities, useProvinces } from '../hooks/useLocations';

export function LocationSelector({ values, onChange }) {
  const { data: provinces = [] } = useProvinces();
  const { data: districts = [] } = useDistricts(values.province);
  const { data: municipalities = [] } = useMunicipalities(values.province, values.district);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Select
        label="Province"
        value={values.province}
        onChange={(event) => onChange('province', event.target.value)}
        options={provinces.map((item) => ({ label: item.name || item.label || item, value: item.id || item.name || item }))}
      />
      <Select
        label="District"
        value={values.district}
        onChange={(event) => onChange('district', event.target.value)}
        options={districts.map((item) => ({ label: item.name || item.label || item, value: item.id || item.name || item }))}
      />
      <Select
        label="Municipality"
        value={values.municipality}
        onChange={(event) => onChange('municipality', event.target.value)}
        options={municipalities.map((item) => ({ label: item.name || item.label || item, value: item.id || item.name || item }))}
      />
    </div>
  );
}

export default LocationSelector;
