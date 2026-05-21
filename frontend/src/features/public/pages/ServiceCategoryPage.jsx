import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { ROUTES } from '../../../constants/routes.constant';
import { getErrorMessage } from '../../../utils/errorHandler';
import { usePublicFaqs } from '../../../hooks/usePublicFaqs';
import { useServiceCategory } from '../../../hooks/useServiceCategory';
import { useCategoryServices } from '../../../hooks/useCategoryServices';
import CategoryHero from '../../../components/categories/CategoryHero';
import CategoryHighlights from '../../../components/categories/CategoryHighlights';
import CategoryServiceFilters from '../../../components/categories/CategoryServiceFilters';
import CategoryServicesGrid from '../../../components/categories/CategoryServicesGrid';
import CategoryBookingSteps from '../../../components/categories/CategoryBookingSteps';
import CategoryFAQ from '../../../components/categories/CategoryFAQ';
import CategoryCTA from '../../../components/categories/CategoryCTA';

const defaultValues = {
  search: '',
  sort: 'newest',
  featured: 'all',
  price: 'all',
};

const fallbackFaqs = [
  {
    id: 'cfaq-1',
    question: 'How do I book a service in this category?',
    answer: 'Choose a service, add details, and submit your request through the SewaFi booking form.',
  },
  {
    id: 'cfaq-2',
    question: 'Can I choose a provider directly?',
    answer: 'Current SewaFi flow uses automatic dispatch unless provider selection is supported by backend workflow.',
  },
  {
    id: 'cfaq-3',
    question: 'How is pricing shown?',
    answer: 'Prices may be estimates when backend provides them. Final amount can depend on service details.',
  },
  {
    id: 'cfaq-4',
    question: 'Can I track my booking?',
    answer: 'Yes, once a booking is created you can track updates from your booking detail or tracking page.',
  },
];

const getComparablePrice = (service) => {
  if (service?.basePrice != null) return Number(service.basePrice);
  if (service?.minPrice != null) return Number(service.minPrice);
  return null;
};

const getCategoryCount = (category, services, hasSearch) => {
  if (category?.serviceCount != null) return Number(category.serviceCount);
  if (category?._count?.services != null) return Number(category._count.services);
  if (!hasSearch) return services.length;
  return null;
};

const getServiceDetailPath = (service) => {
  const routeValue = service?.id || service?.slug;
  if (!routeValue) return ROUTES.services;
  return ROUTES.serviceDetails.replace(':id', String(routeValue));
};

const getServiceBookingPath = (service) => {
  if (!service?.id) return '/customer/book';
  return `/customer/book?serviceId=${encodeURIComponent(service.id)}`;
};

function ServiceCategoryPage() {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categoriesQuery, category } = useServiceCategory(slug);

  const values = {
    search: searchParams.get('search') || defaultValues.search,
    sort: searchParams.get('sort') || defaultValues.sort,
    featured: searchParams.get('featured') || defaultValues.featured,
    price: searchParams.get('price') || defaultValues.price,
  };

  const servicesQuery = useCategoryServices({
    categoryId: category?.id || '',
    categorySlug: category?.slug || slug,
    search: values.search || '',
  });

  const faqQuery = usePublicFaqs('services');
  const faqs = faqQuery.data?.length ? faqQuery.data : fallbackFaqs;

  const services = servicesQuery.data || [];
  const showFeaturedFilter = useMemo(
    () => services.some((service) => service?.isFeatured != null),
    [services]
  );
  const showPriceFilter = useMemo(
    () => services.some((service) => service?.basePrice != null || service?.minPrice != null || service?.maxPrice != null),
    [services]
  );

  const filteredServices = useMemo(() => {
    let next = [...services];

    if (values.featured === 'featured') {
      next = next.filter((service) => service?.isFeatured === true);
    }

    if (showPriceFilter && values.price !== 'all') {
      next = next.filter((service) => {
        const price = getComparablePrice(service);
        if (price == null || Number.isNaN(price)) return false;
        if (values.price === 'under_1000') return price < 1000;
        if (values.price === '1000_3000') return price >= 1000 && price <= 3000;
        if (values.price === '3000_plus') return price > 3000;
        return true;
      });
    }

    if (values.sort === 'name_asc') {
      next.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
    } else if (values.sort === 'price_low_high' && showPriceFilter) {
      next.sort((a, b) => {
        const aPrice = getComparablePrice(a);
        const bPrice = getComparablePrice(b);
        if (aPrice == null) return 1;
        if (bPrice == null) return -1;
        return aPrice - bPrice;
      });
    } else {
      next.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
    }

    return next;
  }, [services, values.featured, values.price, values.sort, showPriceFilter]);

  const bookingPath = useMemo(() => {
    if (category?.id) return `/customer/book?categoryId=${encodeURIComponent(category.id)}`;
    if (category?.slug) return `/customer/book?category=${encodeURIComponent(category.slug)}`;
    if (slug) return `/customer/book?category=${encodeURIComponent(slug)}`;
    return '/customer/book';
  }, [category?.id, category?.slug, slug]);

  const categoryName = category?.name || 'Service';
  const categoryCount = getCategoryCount(category, services, Boolean(values.search));
  const isNotFound = !categoriesQuery.isLoading && !categoriesQuery.isError && !category;

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    const normalizedValue = String(value || '').trim();
    const isDefault = normalizedValue === '' || normalizedValue === defaultValues[key];
    if (isDefault) next.delete(key);
    else next.set(key, normalizedValue);
    setSearchParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    setSearchParams(next);
  };

  const categoryErrorText = getErrorMessage(categoriesQuery.error, 'Unable to load this service category right now.');

  return (
    <div className="bg-[var(--sf-bg)] py-8 sm:py-10 lg:py-12">
      <Container className="space-y-8">
        {categoriesQuery.isLoading ? (
          <>
            <Skeleton className="h-72 rounded-[28px]" />
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-2xl" />
              ))}
            </div>
          </>
        ) : null}

        {!categoriesQuery.isLoading && categoriesQuery.isError ? (
          <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
            <h1 className="text-xl font-bold text-[var(--sf-text-main)]">Unable to load this service category right now.</h1>
            <p className="mt-2 text-sm text-[var(--sf-text-muted)]">{categoryErrorText}</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => categoriesQuery.refetch()}>
                Retry
              </Button>
              <Button as={Link} to={ROUTES.services} variant="outline" className="h-11 rounded-xl">
                Browse Services
              </Button>
            </div>
          </section>
        ) : null}

        {!categoriesQuery.isLoading && !categoriesQuery.isError && isNotFound ? (
          <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
            <h1 className="text-xl font-bold text-[var(--sf-text-main)]">Service category not found.</h1>
            <p className="mt-2 text-sm text-[var(--sf-text-muted)]">The requested category is unavailable or has been removed.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button as={Link} to={ROUTES.services} variant="outline" className="h-11 rounded-xl">
                Browse Services
              </Button>
              <Button as={Link} to={ROUTES.home} variant="outline" className="h-11 rounded-xl">
                Go Home
              </Button>
            </div>
          </section>
        ) : null}

        {!categoriesQuery.isLoading && !categoriesQuery.isError && category ? (
          <>
            <CategoryHero category={category} serviceCount={categoryCount} bookingPath={bookingPath} />
            <CategoryHighlights />

            <CategoryServiceFilters
              values={values}
              onChange={setParam}
              onReset={clearFilters}
              showFeatured={showFeaturedFilter}
              showPriceFilter={showPriceFilter}
              showPriceSort={showPriceFilter}
            />

            <CategoryServicesGrid
              services={filteredServices}
              isLoading={servicesQuery.isLoading}
              isError={servicesQuery.isError}
              onRetry={() => servicesQuery.refetch()}
              browseAllPath={ROUTES.services}
              categoryName={categoryName}
              serviceDetailsPath={getServiceDetailPath}
              serviceBookingPath={getServiceBookingPath}
            />

            <CategoryBookingSteps />
            <CategoryFAQ
              faqs={faqs}
              isLoading={faqQuery.isLoading}
              isError={faqQuery.isError}
              onRetry={() => faqQuery.refetch()}
            />
            <CategoryCTA categoryName={categoryName} bookingPath={bookingPath} />
          </>
        ) : null}
      </Container>
    </div>
  );
}

export default ServiceCategoryPage;
