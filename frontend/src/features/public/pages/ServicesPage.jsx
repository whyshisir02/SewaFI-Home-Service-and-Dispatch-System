import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container } from '../../../components/ui/Layout/Container';
import { Drawer } from '../../../components/ui/Overlay/Drawer';
import { ServiceCategoryChips } from '../../services/components/ServiceCategoryChips';
import { ServiceFilters } from '../../services/components/ServiceFilters';
import { ServiceHero } from '../../services/components/ServiceHero';
import { ServiceSearchBar } from '../../services/components/ServiceSearchBar';
import { ServicesGrid } from '../../services/components/ServicesGrid';
import { ServicesTrustStrip } from '../../services/components/ServicesTrustStrip';
import { usePublicServiceCategories, usePublicServices, useServiceLocations } from '../../services/hooks/useServicesPageData';

const defaultSort = 'recommended';

const updateParams = (searchParams, updates) => {
  const next = new URLSearchParams(searchParams);

  Object.entries(updates).forEach(([key, value]) => {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  });

  return next;
};

function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draftSearch, setDraftSearch] = useState(searchParams.get('search') || '');
  const [draftLocation, setDraftLocation] = useState(searchParams.get('location') || '');
  const [draftMinPrice, setDraftMinPrice] = useState(searchParams.get('minPrice') || '');
  const [draftMaxPrice, setDraftMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeSearch = searchParams.get('search') || '';
  const activeCategory = searchParams.get('category') || '';
  const activeLocation = searchParams.get('location') || '';
  const activeMinPrice = searchParams.get('minPrice') || '';
  const activeMaxPrice = searchParams.get('maxPrice') || '';
  const activeSort = searchParams.get('sort') || defaultSort;

  const servicesQuery = usePublicServices({
    search: activeSearch,
    category: activeCategory,
    sort: activeSort,
    minPrice: activeMinPrice,
    maxPrice: activeMaxPrice,
  });
  const categoriesQuery = usePublicServiceCategories();
  const locationsQuery = useServiceLocations();

  const services = useMemo(() => servicesQuery.data?.services || [], [servicesQuery.data?.services]);
  const totalCount = servicesQuery.data?.meta?.total ?? services.length;

  const applyParams = (updates) => {
    setSearchParams(updateParams(searchParams, updates));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    applyParams({
      search: draftSearch.trim(),
      location: draftLocation,
      minPrice: draftMinPrice,
      maxPrice: draftMaxPrice,
    });
  };

  const handleCategorySelect = (categoryId) => {
    applyParams({ category: categoryId });
  };

  const handleLocationChange = (location) => {
    setDraftLocation(location);
    applyParams({ location });
  };

  const handleSortChange = (sort) => {
    applyParams({ sort: sort === defaultSort ? '' : sort });
  };

  const handleMinPriceChange = (value) => {
    setDraftMinPrice(value);
    applyParams({ minPrice: value });
  };

  const handleMaxPriceChange = (value) => {
    setDraftMaxPrice(value);
    applyParams({ maxPrice: value });
  };

  const handleReset = () => {
    setDraftSearch('');
    setDraftLocation('');
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setMobileFiltersOpen(false);
    setSearchParams({});
  };

  const filters = (
    <ServiceFilters
      location={activeLocation}
      locations={locationsQuery.data || []}
      sort={activeSort}
      minPrice={draftMinPrice}
      maxPrice={draftMaxPrice}
      onLocationChange={handleLocationChange}
      onSortChange={handleSortChange}
      onMinPriceChange={handleMinPriceChange}
      onMaxPriceChange={handleMaxPriceChange}
      onReset={handleReset}
    />
  );

  return (
    <div className="bg-[var(--sf-bg)]">
      <ServiceHero />

      <section className="bg-[var(--sf-bg)] py-9 sm:py-11 lg:py-12">
        <Container className="space-y-7">
          <ServiceSearchBar
            search={draftSearch}
            location={draftLocation}
            locations={locationsQuery.data || []}
            locationsLoading={locationsQuery.isLoading}
            onSearchChange={setDraftSearch}
            onLocationChange={setDraftLocation}
            onSubmit={handleSearchSubmit}
          />

          <ServiceCategoryChips
            categories={categoriesQuery.data || []}
            activeCategory={activeCategory}
            isLoading={categoriesQuery.isLoading}
            onSelect={handleCategorySelect}
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr] lg:gap-7">
            <div className="hidden lg:block">{filters}</div>
            <ServicesGrid
              services={services}
              isLoading={servicesQuery.isLoading}
              isError={servicesQuery.isError}
              count={totalCount}
              sort={activeSort}
              onSortChange={handleSortChange}
              onRetry={() => servicesQuery.refetch()}
              onClearFilters={handleReset}
              onOpenFilters={() => setMobileFiltersOpen(true)}
            />
          </div>
        </Container>
      </section>

      <ServicesTrustStrip />

      <Drawer open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title="Service Filters">
        {filters}
      </Drawer>
    </div>
  );
}

export default ServicesPage;
