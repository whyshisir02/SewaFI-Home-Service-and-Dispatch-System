import { ArrowRight, Clock, ImageIcon, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button/Button';
import { ROUTES } from '../../constants/routes.constant';
import { formatCurrency } from '../../utils/formatCurrency';

const serviceImage = (service) => service.imageUrl || service.image;
const detailsPath = (service) => `${ROUTES.services}/${service.slug || service.id}`;
const bookPath = (service) => `${ROUTES.customer.book.replace(':serviceId', service.id)}?serviceId=${encodeURIComponent(service.id)}`;

export function ServiceCard({ service }) {
  const image = serviceImage(service);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--sf-secondary)] hover:shadow-[var(--sf-shadow)]">
      <div className="relative overflow-hidden p-3 pb-0">
        <div className="overflow-hidden rounded-2xl bg-[var(--sf-surface-soft)]">
          {image ? (
            <img src={image} alt={`${service.name} service`} className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
          ) : (
            <div className="flex h-44 w-full items-center justify-center bg-[radial-gradient(circle_at_top,var(--sf-secondary-soft),transparent_38%),linear-gradient(135deg,var(--sf-primary-soft),var(--sf-surface-soft))] text-[var(--sf-primary)]">
              <ImageIcon className="h-11 w-11" aria-hidden="true" />
            </div>
          )}
        </div>
        <span className="absolute bottom-4 left-6 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-[var(--sf-surface)] text-[var(--sf-secondary)] shadow-sm">
          <Wrench className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 inline-flex w-fit rounded-full bg-[var(--sf-secondary-soft)] px-3 py-1 text-xs font-bold text-[var(--sf-secondary)]">
          {service.category?.name || service.subCategory?.name || 'Home service'}
        </div>
        <h3 className="text-lg font-extrabold leading-7 text-[var(--sf-text-main)]">{service.name}</h3>
        {service.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--sf-text-muted)]">{service.description}</p>
        ) : null}

        <div className="mt-5 space-y-2 text-sm text-[var(--sf-text-muted)]">
          {service.estimatedDuration ? (
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
              {service.estimatedDuration}
            </span>
          ) : null}
          <p className="font-bold text-[var(--sf-text-main)]">
            {service.basePrice ? `From ${formatCurrency(service.basePrice)}` : 'Estimate available during booking'}
          </p>
        </div>

        <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-2">
          <Button as={Link} to={bookPath(service)} className="rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95">
            Book Now
          </Button>
          <Button as={Link} to={detailsPath(service)} variant="outline" className="rounded-xl">
            Details
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
}

export default ServiceCard;
