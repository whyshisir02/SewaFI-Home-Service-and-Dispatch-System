import { Link } from 'react-router-dom';
import { Clock3, ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { EmptyState } from '../ui/Feedback/EmptyState';
import { SkeletonCard } from '../common/SkeletonCard';
import { formatCurrency } from '../../utils/formatCurrency';

const getServiceImage = (service) => service?.imageUrl || service?.image || null;

const formatPrice = (service) => {
  if (service?.minPrice != null && service?.maxPrice != null) {
    return `${formatCurrency(service.minPrice)} - ${formatCurrency(service.maxPrice)}`;
  }

  if (service?.basePrice != null) return formatCurrency(service.basePrice);
  return null;
};

export function CategoryServicesGrid({
  services = [],
  isLoading,
  isError,
  onRetry,
  browseAllPath,
  categoryName,
  serviceDetailsPath,
  serviceBookingPath,
}) {
  if (isLoading) {
    return (
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </section>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Unable to load services"
        description="Unable to load services for this category right now."
        actionLabel="Retry"
        onAction={onRetry}
      />
    );
  }

  if (!services.length) {
    return (
      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
        <h2 className="text-lg font-semibold text-[var(--sf-text-main)]">No services are available in this category yet.</h2>
        <p className="mt-2 text-sm text-[var(--sf-text-muted)]">Browse all services to explore other available options.</p>
        <Button as={Link} to={browseAllPath || '/services'} variant="outline" className="mt-4 h-11 rounded-xl">
          Browse All Services
        </Button>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-extrabold text-[var(--sf-text-main)]">
        Available {categoryName} Services
      </h2>
      <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => {
          const image = getServiceImage(service);
          const price = formatPrice(service);

          return (
            <article key={service?.id || service?.slug} className="overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]">
              <div className="border-b border-[var(--sf-border)] bg-[var(--sf-surface-soft)]">
                {image ? (
                  <img src={image} alt={service?.name ? `${service.name} service` : 'Service image'} className="h-44 w-full object-cover" />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center text-[var(--sf-text-muted)]">
                    <ImageIcon className="h-10 w-10" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="inline-flex rounded-full bg-[var(--sf-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--sf-primary)]">
                  {service?.category?.name || 'Home service'}
                </div>
                <h3 className="mt-3 text-xl font-bold text-[var(--sf-text-main)]">{service?.name || 'Service'}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--sf-text-muted)]">
                  {service?.description || 'Service details are available in the service page.'}
                </p>

                <div className="mt-4 space-y-2 text-sm text-[var(--sf-text-muted)]">
                  {price ? <p className="font-semibold text-[var(--sf-text-main)]">Price: {price}</p> : null}
                  {service?.estimatedDuration ? (
                    <p className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4" aria-hidden="true" />
                      {service.estimatedDuration}
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Button as={Link} to={serviceDetailsPath(service)} variant="outline" className="h-11 rounded-xl">
                    View Details
                  </Button>
                  <Button as={Link} to={serviceBookingPath(service)} className="h-11 rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95">
                    Book Now
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default CategoryServicesGrid;
