import { ArrowRight, Clock, ImageIcon, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button/Button';
import { EmptyState } from '../ui/Feedback/EmptyState';
import { Container } from '../ui/Layout/Container';
import { SectionHeader } from '../common/SectionHeader';
import { SkeletonCard } from '../common/SkeletonCard';
import { ROUTES } from '../../constants/routes.constant';
import { useFeaturedServices } from '../../hooks/useHomePageData';
import { formatCurrency } from '../../utils/formatCurrency';

const detailPath = (service) => `${ROUTES.services}/${service.slug || service.id}`;
const bookPath = (service) => `${ROUTES.customer.book.replace(':serviceId', service.id)}?serviceId=${encodeURIComponent(service.id)}`;

function ServiceImage({ service }) {
  const image = service.imageUrl || service.image;

  if (image) {
    return (
      <img
        src={image}
        alt={`${service.name} service`}
        className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
      />
    );
  }

  return (
    <div className="flex h-44 w-full items-center justify-center bg-[radial-gradient(circle_at_top,var(--sf-secondary-soft),transparent_38%),linear-gradient(135deg,var(--sf-primary-soft),var(--sf-surface-soft))] text-[var(--sf-primary)]">
      <ImageIcon className="h-12 w-12" aria-hidden="true" />
    </div>
  );
}

function ServiceCard({ service }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--sf-secondary)] hover:shadow-[var(--sf-shadow)]">
      <div className="relative overflow-hidden">
        <ServiceImage service={service} />
        <span className="absolute bottom-4 left-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-[var(--sf-surface)] text-[var(--sf-secondary)] shadow-sm">
          <Wrench className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 inline-flex w-fit rounded-full bg-[var(--sf-secondary-soft)] px-3 py-1 text-xs font-bold text-[var(--sf-secondary)]">
          {service.category?.name || 'Home service'}
        </div>
        <h3 className="text-lg font-extrabold leading-7 text-[var(--sf-text-main)]">{service.name}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--sf-text-muted)]">{service.description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--sf-text-muted)]">
          {service.estimatedDuration ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4 text-[var(--sf-secondary)]" />
              {service.estimatedDuration}
            </span>
          ) : null}
          {service.basePrice ? (
            <span className="font-bold text-[var(--sf-text-main)]">From {formatCurrency(service.basePrice)}</span>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <Link to={detailPath(service)} className="text-sm font-bold text-[var(--sf-secondary)] transition hover:underline">
            View Details
          </Link>
          <Button as={Link} to={bookPath(service)} className="rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95">
            Book Now
          </Button>
        </div>
      </div>
    </article>
  );
}

export function PopularServices() {
  const servicesQuery = useFeaturedServices();
  const services = servicesQuery.data || [];

  return (
    <section className="bg-[var(--sf-bg)] py-12 sm:py-16 lg:py-24">
      <Container>
        <SectionHeader
          title="Popular Home Services"
          description="Choose a service and SewaFi will guide you through booking and dispatch."
        />

        <div className="mt-10">
          {servicesQuery.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : null}

          {servicesQuery.isError ? (
            <EmptyState
              title="Unable to load services"
              description="We could not load services right now. Please try again."
              actionLabel="Retry"
              onAction={() => servicesQuery.refetch()}
            />
          ) : null}

          {!servicesQuery.isLoading && !servicesQuery.isError && !services.length ? (
            <EmptyState title="No services available" description="No services are available right now. Please check again later." />
          ) : null}

          {!servicesQuery.isLoading && !servicesQuery.isError && services.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-10 text-center">
          <Link to={ROUTES.services} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--sf-secondary)] hover:underline">
            View all services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}

export default PopularServices;
