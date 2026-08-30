import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import { Select } from '../../../../components/ui/Input/Select';

const baseSortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name_asc', label: 'Name A-Z' },
];

const featuredOptions = [
  { value: 'all', label: 'All Services' },
  { value: 'featured', label: 'Featured only' },
];

const priceOptions = [
  { value: 'all', label: 'All Prices' },
  { value: 'under_1000', label: 'Under NPR 1000' },
  { value: '1000_3000', label: 'NPR 1000 - 3000' },
  { value: '3000_plus', label: 'NPR 3000+' },
];

export function CategoryServiceFilters({
  values,
  onChange,
  onReset,
  showFeatured,
  showPriceFilter,
  showPriceSort,
}) {
  const sortOptions = showPriceSort
    ? [...baseSortOptions, { value: 'price_low_high', label: 'Price low-high' }]
    : baseSortOptions;

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          label="Search Services"
          placeholder="Search services in this category..."
          value={values.search}
          onChange={(event) => onChange('search', event.target.value)}
        />
        <Select
          label="Sort"
          value={values.sort}
          onChange={(event) => onChange('sort', event.target.value)}
          options={sortOptions}
        />
        {showPriceFilter ? (
          <Select
            label="Price"
            value={values.price}
            onChange={(event) => onChange('price', event.target.value)}
            options={priceOptions}
          />
        ) : null}
        {showFeatured ? (
          <Select
            label="Featured"
            value={values.featured}
            onChange={(event) => onChange('featured', event.target.value)}
            options={featuredOptions}
          />
        ) : null}
      </div>
      <div className="mt-3">
        <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={onReset}>
          Clear Filters
        </Button>
      </div>
    </section>
  );
}

export default CategoryServiceFilters;
