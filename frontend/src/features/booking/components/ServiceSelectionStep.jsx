import { Clock, Wallet, Wrench } from 'lucide-react';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { BookingField, fieldClass } from './BookingField';
import { formatCurrency } from '../../../utils/formatCurrency';

export function ServiceSelectionStep({
  categories = [],
  services = [],
  selectedService,
  values,
  errors,
  loading,
  serviceWarning,
  onChange,
  onBlur,
}) {
  const availableServices = values.categoryId ? services.filter((service) => service.categoryId === values.categoryId) : services;

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]">
          <Wrench className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Step 1</p>
          <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Select Service</h2>
        </div>
      </div>

      {serviceWarning ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-warning)] bg-[var(--sf-accent-soft)] p-4 text-sm font-semibold text-[var(--sf-text-main)]">
          {serviceWarning}
        </div>
      ) : null}

      {!loading && !services.length ? (
        <div className="mt-6">
          <EmptyState title="No services available" description="No services are available right now." />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <BookingField label="Service Category" hint="Categories are loaded from SewaFi services." error={errors.categoryId}>
            <select
              value={values.categoryId}
              onChange={(event) => onChange('categoryId', event.target.value)}
              onBlur={() => onBlur('categoryId')}
              className={fieldClass}
              disabled={loading}
            >
              <option value="">{loading ? 'Loading categories...' : 'All categories'}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </BookingField>

          <BookingField label="Specific Service" required error={errors.serviceId}>
            <select
              value={values.serviceId}
              onChange={(event) => onChange('serviceId', event.target.value)}
              onBlur={() => onBlur('serviceId')}
              className={fieldClass}
              disabled={loading || !services.length}
            >
              <option value="">{loading ? 'Loading services...' : 'Choose a service'}</option>
              {availableServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </BookingField>
        </div>
      )}

      {selectedService ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-4">
          <h3 className="font-bold text-[var(--sf-text-main)]">{selectedService.name}</h3>
          {selectedService.description ? <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{selectedService.description}</p> : null}
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--sf-text-muted)]">
            {selectedService.basePrice ? (
              <span className="inline-flex items-center gap-2 font-bold text-[var(--sf-text-main)]">
                <Wallet className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
                From {formatCurrency(selectedService.basePrice)}
              </span>
            ) : null}
            {selectedService.estimatedDuration ? (
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
                {selectedService.estimatedDuration}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ServiceSelectionStep;
