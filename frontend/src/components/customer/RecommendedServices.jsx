import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { EmptyState } from '../ui/Feedback/EmptyState';
import { Skeleton } from '../ui/Feedback/Skeleton';
import { ServiceImage } from '../services/ServiceImage';
import { formatCurrency } from '../../utils/formatCurrency';

export function RecommendedServices({ services = [], isLoading, isError }) {
  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading recommended services">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-72 rounded-2xl" />
        ))}
      </section>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
        <p className="font-semibold text-[var(--sf-text-main)]">Unable to load recommended services right now.</p>
        <p className="mt-2 text-sm text-[var(--sf-text-muted)]">Please refresh the page or try again later.</p>
      </div>
    );
  }

  if (!services.length) {
    return (
      <EmptyState
        title="Recommended services will appear here once services are configured."
        description="SewaFi will show real services from the backend when they are available."
      />
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Recommended services">
      {services.slice(0, 4).map((service) => {
        const detailPath = `/services/${service.slug || service.id}`;
        return (
          <article
            key={service.id}
            className="group overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-[0_16px_40px_rgba(7,59,115,0.08)] transition hover:-translate-y-1 hover:border-[var(--sf-secondary)]"
          >
            <Link to={detailPath} className="block">
              <div className="relative h-36 overflow-hidden bg-[linear-gradient(135deg,var(--sf-primary-soft),var(--sf-secondary-soft))]">
                <ServiceImage
                  service={service}
                  alt={service.name || 'SewaFi service'}
                  mediaClassName="h-full"
                  imageClassName="transition duration-300 group-hover:scale-[1.03]"
                  iconClassName="h-7 w-7"
                />
              </div>
            </Link>
            <div className="space-y-4 p-4">
              <div>
                <h3 className="line-clamp-1 text-lg font-bold text-[var(--sf-text-main)]">{service.name}</h3>
                {service.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--sf-text-muted)]">{service.description}</p> : null}
              </div>

              <div className="space-y-2 text-sm text-[var(--sf-text-muted)]">
                {service.estimatedDuration ? (
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[var(--sf-secondary)]" />
                    {service.estimatedDuration}
                  </p>
                ) : null}
                {service.basePrice != null ? (
                  <p className="font-semibold text-[var(--sf-text-main)]">From {formatCurrency(service.basePrice)}</p>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button
                  as={Link}
                  to={`/customer/book?serviceId=${service.id}`}
                  className="h-10 flex-1 rounded-xl bg-[var(--sf-accent)] text-white hover:bg-[var(--sf-accent)]/90"
                >
                  Book Now
                </Button>
                <Button as={Link} to={detailPath} variant="outline" size="sm" className="h-10 rounded-xl" aria-label={`View ${service.name}`}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default RecommendedServices;
