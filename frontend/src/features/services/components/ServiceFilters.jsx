import { SearchFilterBar } from '../../../components/common/SearchFilterBar';
import { Select } from '../../../components/ui/Input/Select';

export function ServiceFilters({
  searchValue,
  onSearchChange,
  categories = [],
  filters,
  onFilterChange,
  provinceOptions = [],
  districtOptions = [],
  municipalityOptions = [],
  loadingProvinces = false,
  loadingDistricts = false,
  loadingMunicipalities = false,
}) {
  return (
    <div className="space-y-3">
      <SearchFilterBar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        filters={[
          <Select
            key="category"
            label="Category"
            placeholder="All categories"
            value={filters.category}
            onChange={(event) => onFilterChange('category', event.target.value)}
            options={categories.map((category) => ({
              label: category.name,
              value: category.id,
            }))}
          />,

          <Select
            key="province"
            label="Province"
            placeholder={loadingProvinces ? 'Loading provinces...' : 'All provinces'}
            value={filters.province}
            onChange={(event) => onFilterChange('province', event.target.value)}
            options={provinceOptions}
          />,

          <Select
            key="district"
            label="District"
            placeholder={loadingDistricts ? 'Loading districts...' : 'All districts'}
            value={filters.district}
            onChange={(event) => onFilterChange('district', event.target.value)}
            options={districtOptions}
            disabled={!filters.province || loadingDistricts}
          />,

          <Select
            key="municipality"
            label="Municipality"
            placeholder={
              loadingMunicipalities ? 'Loading municipalities...' : 'All municipalities'
            }
            value={filters.municipality}
            onChange={(event) => onFilterChange('municipality', event.target.value)}
            options={municipalityOptions}
            disabled={!filters.district || loadingMunicipalities}
          />,
        ]}
      />

      {filters.province && filters.district ? (
        <p className="text-sm text-[var(--sf-text-muted)]">
          Showing services available in{' '}
          {[filters.municipality, filters.district, filters.province]
            .filter(Boolean)
            .join(', ')}
          .
        </p>
      ) : (
        <p className="text-sm text-[var(--sf-text-muted)]">
          Select province and district to filter services by provider working area.
        </p>
      )}
    </div>
  );
}

export default ServiceFilters;