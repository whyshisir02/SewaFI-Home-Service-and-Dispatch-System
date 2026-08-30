import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { SearchFilterBar } from '../../../components/common/SearchFilterBar';
import { Select } from '../../../components/ui/Input/Select';

const sortOptions = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

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
  location = '',
  locations = [],
  sort = 'recommended',
  minPrice = '',
  maxPrice = '',
  onLocationChange,
  onSortChange,
  onMinPriceChange,
  onMaxPriceChange,
  onReset,
}) {
  const normalizedFilters = filters ?? {};
  const hasLegacyShape = typeof onFilterChange === 'function';

  if (!hasLegacyShape) {
    return (
      <div className="space-y-4 rounded-[1.75rem] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
          <Select
            label="Location"
            value={location}
            onChange={(event) => onLocationChange?.(event.target.value)}
            placeholder={locations.length ? 'All locations' : 'Loading locations...'}
            options={locations.map((item) => ({ label: item.name, value: item.name }))}
          />

          <Select
            label="Sort"
            value={sort}
            onChange={(event) => onSortChange?.(event.target.value)}
            placeholder="Recommended"
            options={sortOptions}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Min price"
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) => onMinPriceChange?.(event.target.value)}
            placeholder="Min"
          />
          <Input
            label="Max price"
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => onMaxPriceChange?.(event.target.value)}
            placeholder="Max"
          />
        </div>

        <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={onReset}>
          Clear filters
        </Button>
      </div>
    );
  }

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
            value={normalizedFilters.category ?? ''}
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
            value={normalizedFilters.province ?? ''}
            onChange={(event) => onFilterChange('province', event.target.value)}
            options={provinceOptions}
          />,

          <Select
            key="district"
            label="District"
            placeholder={loadingDistricts ? 'Loading districts...' : 'All districts'}
            value={normalizedFilters.district ?? ''}
            onChange={(event) => onFilterChange('district', event.target.value)}
            options={districtOptions}
            disabled={!normalizedFilters.province || loadingDistricts}
          />,

          <Select
            key="municipality"
            label="Municipality"
            placeholder={
              loadingMunicipalities ? 'Loading municipalities...' : 'All municipalities'
            }
            value={normalizedFilters.municipality ?? ''}
            onChange={(event) => onFilterChange('municipality', event.target.value)}
            options={municipalityOptions}
            disabled={!normalizedFilters.district || loadingMunicipalities}
          />,
        ]}
      />

      {normalizedFilters.province && normalizedFilters.district ? (
        <p className="text-sm text-[var(--sf-text-muted)]">
          Showing services available in{' '}
          {[normalizedFilters.municipality, normalizedFilters.district, normalizedFilters.province]
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