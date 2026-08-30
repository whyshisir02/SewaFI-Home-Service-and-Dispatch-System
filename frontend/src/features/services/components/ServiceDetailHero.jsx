import { Clock, MapPinned, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { ServiceImage } from './ServiceImage';

export function ServiceDetailHero({ service }) {
  const title = service?.title || service?.name;
  const description = service?.longDescription || service?.description;
  const metaChips = [
    service?.estimatedDuration ? { label: service.estimatedDuration, icon: Clock } : null,
    service?.averageRating && service?.reviewCount ? { label: `${service.averageRating} based on ${service.reviewCount} reviews`, icon: Star } : null,
    service?.dispatchType ? { label: service.dispatchType, icon: MapPinned } : null,
    service?.availability ? { label: service.availability, icon: ShieldCheck } : null,
  ].filter(Boolean);

  return (
    <section className="grid gap-8 overflow-hidden rounded-[28px] border border-[var(--sf-border)] bg-[linear-gradient(135deg,var(--sf-surface)_0%,var(--sf-primary-soft)_55%,var(--sf-secondary-soft)_100%)] p-5 shadow-[var(--sf-shadow)] sm:p-7 lg:grid-cols-[1fr_0.92fr] lg:p-8">
      <div className="flex flex-col justify-center">
        <div className="flex flex-wrap gap-3">
          {service?.category?.name ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--sf-secondary)] px-4 py-2 text-sm font-bold text-white">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {service.category.name}
            </span>
          ) : null}
          {service?.isFeatured ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-2 text-sm font-bold text-[var(--sf-primary)]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Featured service
            </span>
          ) : null}
          {service?.isActive !== false ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-2 text-sm font-bold text-[var(--sf-secondary)]">
              Active
            </span>
          ) : null}
        </div>

        <h1 className="mt-6 font-display text-[34px] font-extrabold leading-[44px] tracking-tight text-[var(--sf-text-main)] sm:text-5xl sm:leading-[58px] lg:text-[50px] lg:leading-[60px]">
          {title}
        </h1>
        {description ? <p className="mt-5 text-[15px] leading-7 text-[var(--sf-text-muted)] sm:text-lg sm:leading-8">{description}</p> : null}

        {metaChips.length ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {metaChips.map((chip) => {
              const Icon = chip.icon;

              return (
                <span key={chip.label} className="inline-flex items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 py-2 text-sm font-semibold text-[var(--sf-text-muted)]">
                  <Icon className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
                  {chip.label}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-[var(--sf-shadow)]">
        <ServiceImage
          service={service}
          alt={`${title} service`}
          mediaClassName="aspect-[16/10] h-full min-h-[260px]"
          iconClassName="h-16 w-16"
        />
      </div>
    </section>
  );
}

export default ServiceDetailHero;
