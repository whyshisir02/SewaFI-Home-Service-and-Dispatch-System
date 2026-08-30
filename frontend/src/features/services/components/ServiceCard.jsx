import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Wrench } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { ServiceImage } from './ServiceImage';
import { serviceBookPath, serviceDetailPath } from '../utils/servicePaths';
import { formatCurrency } from '../../../utils/formatCurrency';

export const ServiceCard = memo(function ServiceCard({ service }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--sf-secondary)] hover:shadow-[var(--sf-shadow)]">
      <div className="relative overflow-hidden">
        <ServiceImage
          service={service}
          alt={service?.name ? `${service.name} service` : 'Service image'}
          mediaClassName="h-44"
          imageClassName="transition duration-300 group-hover:scale-[1.03]"
          iconClassName="h-12 w-12"
        />
        <span className="absolute bottom-4 left-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-[var(--sf-surface)] text-[var(--sf-secondary)] shadow-sm">
          <Wrench className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 inline-flex w-fit rounded-full bg-[var(--sf-secondary-soft)] px-3 py-1 text-xs font-bold text-[var(--sf-secondary)]">
          {service.category?.name || service.subCategory?.name || 'Home service'}
        </div>
        <h3 className="text-lg font-extrabold leading-7 text-[var(--sf-text-main)]">{service.name}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--sf-text-muted)]">
          {service.description || 'Reliable professionals with clear scheduling and pricing.'}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--sf-text-muted)]">
          {service.estimatedDuration ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
              {service.estimatedDuration}
            </span>
          ) : null}
          {service.basePrice ? (
            <span className="font-bold text-[var(--sf-text-main)]">From {formatCurrency(service.basePrice)}</span>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <Link
            to={serviceDetailPath(service)}
            className="text-sm font-bold text-[var(--sf-secondary)] transition hover:underline"
          >
            View Details
          </Link>
          <Button
            as={Link}
            to={serviceBookPath(service)}
            className="rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95"
          >
            Book Now
          </Button>
        </div>
      </div>
    </article>
  );
});

export default ServiceCard;
