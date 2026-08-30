import { Clock, Wallet } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';

const priceLabel = (service) => {
  if (service?.minPrice && service?.maxPrice) return `${formatCurrency(service.minPrice)} - ${formatCurrency(service.maxPrice)}`;
  if (service?.basePrice) return `From ${formatCurrency(service.basePrice)}`;
  return null;
};

export function ServicePriceDuration({ service }) {
  const price = priceLabel(service);
  const items = [
    service?.estimatedDuration ? { title: 'Estimated Duration', value: service.estimatedDuration, icon: Clock } : null,
    price ? { title: 'Estimated Price', value: price, icon: Wallet } : null,
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
        const Icon = item.icon;

        return (
          <article key={item.title} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-text-soft)]">{item.title}</p>
            <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">{item.value}</p>
          </article>
        );
        })}
      </div>
      <p className="text-xs text-[var(--sf-text-muted)]">
        Final price may vary after site inspection and customer confirmation.
      </p>
    </section>
  );
}

export default ServicePriceDuration;
