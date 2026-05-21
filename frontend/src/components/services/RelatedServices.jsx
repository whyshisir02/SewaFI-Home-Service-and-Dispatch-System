import { Link } from 'react-router-dom';
import { ArrowRight, Clock, ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { EmptyState } from '../ui/Feedback/EmptyState';
import { SkeletonCard } from '../common/SkeletonCard';
import { ROUTES } from '../../constants/routes.constant';
import { formatCurrency } from '../../utils/formatCurrency';

const imageFor = (service) => service?.imageUrl || service?.image;
const detailPath = (service) => `${ROUTES.services}/${service.slug || service.id}`;
const bookPath = (service) => `${ROUTES.customer.book.replace(':serviceId', service.id)}?serviceId=${encodeURIComponent(service.id)}`;

export function RelatedServices({ services = [], isLoading, isError, onRetry }) {
  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)] sm:text-3xl">Related Services</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">Explore services from the same backend category.</p>
        </div>
        <Link to={ROUTES.services} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--sf-secondary)] hover:underline">
          View all services
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : null}

        {isError ? (
          <EmptyState title="Unable to load related services" description="Related services could not be loaded right now." actionLabel="Retry" onAction={onRetry} />
        ) : null}

        {!isLoading && !isError && !services.length ? <EmptyState title="No related services found." description="Try exploring other categories or check back later." /> : null}

        {!isLoading && !isError && services.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => {
              const image = imageFor(service);

              return (
                <article key={service.id} className="overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] transition duration-300 hover:-translate-y-1 hover:border-[var(--sf-secondary)]">
                  <div className="overflow-hidden">
                    {image ? (
                      <img src={image} alt={`${service.name} service`} className="h-36 w-full object-cover" />
                    ) : (
                      <div className="flex h-36 w-full items-center justify-center bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
                        <ImageIcon className="h-10 w-10" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-[var(--sf-text-main)]">{service.name}</h3>
                    {service.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--sf-text-muted)]">{service.description}</p> : null}
                    <div className="mt-4 space-y-2 text-sm text-[var(--sf-text-muted)]">
                      {service.estimatedDuration ? (
                        <span className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
                          {service.estimatedDuration}
                        </span>
                      ) : null}
                      {service.basePrice ? <p className="font-bold text-[var(--sf-text-main)]">From {formatCurrency(service.basePrice)}</p> : null}
                    </div>
                    <div className="mt-5 grid gap-2">
                      <Button as={Link} to={bookPath(service)} className="rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95">
                        Book Now
                      </Button>
                      <Link to={detailPath(service)} className="text-center text-sm font-bold text-[var(--sf-secondary)] hover:underline">
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default RelatedServices;
