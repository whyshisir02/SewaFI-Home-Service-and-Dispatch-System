import { useMemo, useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { Container } from '../../../components/ui/Layout/Container';
import { useDebounce } from '../../../hooks/useDebounce';
import { ServiceFilters } from '../components/ServiceFilters';
import { ServiceGrid } from '../components/ServiceGrid';
import { useServiceCategories } from '../hooks/useServiceCategories';
import { useServices } from '../hooks/useServices';
import {
  useDistricts,
  useMunicipalities,
  useProvinces,
} from '../../location/hooks/useLocations';

const toLocationOptions = (items = []) =>
  items.map((item) => {
    const label = item.name || item.label || item;
    const value = item.name || item.value || item;

    return {
      label,
      value,
    };
  });

function ServiceList() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [municipality, setMunicipality] = useState('');

  const debouncedSearch = useDebounce(search);

  const { data: categories = [] } = useServiceCategories();

  const provincesQuery = useProvinces();
  const districtsQuery = useDistricts(province);
  const municipalitiesQuery = useMunicipalities(province, district);

  const hasLocationFilter = Boolean(province && district);

  const serviceFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(category ? { category } : {}),

      ...(hasLocationFilter
        ? {
            province,
            district,
            ...(municipality ? { municipality } : {}),
          }
        : {}),
    }),
    [category, debouncedSearch, district, hasLocationFilter, municipality, province]
  );

  const { data: services = [], isLoading } = useServices(serviceFilters);

  const handleFilterChange = (key, value) => {
    if (key === 'category') {
      setCategory(value);
      return;
    }

    if (key === 'province') {
      setProvince(value);
      setDistrict('');
      setMunicipality('');
      return;
    }

    if (key === 'district') {
      setDistrict(value);
      setMunicipality('');
      return;
    }

    if (key === 'municipality') {
      setMunicipality(value);
    }
  };

  return (
    <Container className="space-y-8">
      <PageHeader
        eyebrow="Services"
        title="Book trusted experts by service domain"
        description="Browse active service categories, compare options, and start a guided booking flow."
      />

      <ServiceFilters
        searchValue={search}
        onSearchChange={(event) => setSearch(event.target.value)}
        categories={categories}
        filters={{
          category,
          province,
          district,
          municipality,
        }}
        onFilterChange={handleFilterChange}
        provinceOptions={toLocationOptions(provincesQuery.data || [])}
        districtOptions={toLocationOptions(districtsQuery.data || [])}
        municipalityOptions={toLocationOptions(municipalitiesQuery.data || [])}
        loadingProvinces={provincesQuery.isLoading}
        loadingDistricts={districtsQuery.isLoading}
        loadingMunicipalities={municipalitiesQuery.isLoading}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      ) : services.length ? (
        <ServiceGrid services={services} />
      ) : (
        <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-8 text-center">
          <h3 className="text-lg font-bold text-[var(--sf-text-main)]">
            {hasLocationFilter
              ? 'No services available in this location yet'
              : 'No services found'}
          </h3>

          <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
            {hasLocationFilter
              ? 'Try another nearby municipality or check again later as more providers join SewaFi.'
              : 'Try changing your search or category filter.'}
          </p>
        </div>
      )}
    </Container>
  );
}

export default ServiceList;
