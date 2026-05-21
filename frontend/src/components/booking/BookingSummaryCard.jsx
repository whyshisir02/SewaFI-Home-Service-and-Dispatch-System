import { ArrowRight, CalendarCheck, Clock, MapPin, Radar, ShieldCheck, Wallet, Wrench } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { formatCurrency } from '../../utils/formatCurrency';

const priceLabel = (service) => {
  if (service?.minPrice && service?.maxPrice) return `${formatCurrency(service.minPrice)} - ${formatCurrency(service.maxPrice)}`;
  if (service?.basePrice) return `From ${formatCurrency(service.basePrice)}`;
  return 'Estimate available after provider review or during booking.';
};

const compact = (value, fallback = 'Not selected') => value || fallback;

export function BookingSummaryCard({ values, selectedService, selectedCategory, isValid, isSubmitting, submitError, onConfirm }) {
  const location = [values.municipality, values.district, values.province].filter(Boolean).join(', ');
  const preferred = [values.preferredDate, values.preferredTime].filter(Boolean).join(' at ');

  return (
    <aside className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[var(--sf-shadow)] lg:sticky lg:top-24">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Step 5</p>
      <h2 className="mt-2 font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Booking Summary</h2>

      <div className="mt-5 space-y-4">
        <SummaryRow icon={Wrench} label="Service" value={compact(selectedService?.name)} />
        <SummaryRow icon={ShieldCheck} label="Category" value={compact(selectedCategory?.name || selectedService?.category?.name)} />
        <SummaryRow icon={MapPin} label="Location" value={compact(location)} />
        <SummaryRow icon={CalendarCheck} label="Preferred Date & Time" value={compact(preferred)} />
        <SummaryRow icon={Radar} label="Dispatch Type" value="Automatic nearest-provider dispatch" />
        <SummaryRow icon={Wallet} label="Estimated Price" value={priceLabel(selectedService)} />
        {selectedService?.estimatedDuration ? <SummaryRow icon={Clock} label="Estimated Duration" value={selectedService.estimatedDuration} /> : null}
      </div>

      {values.description ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--sf-text-soft)]">Problem Summary</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--sf-text-muted)]">{values.description}</p>
        </div>
      ) : null}

      <p className="mt-5 rounded-2xl bg-[var(--sf-accent-soft)] p-4 text-sm leading-6 text-[var(--sf-text-muted)]">
        This is a starting estimate. Final amount may change after provider inspection and must be confirmed by you after service completion.
      </p>

      {submitError ? (
        <p className="mt-4 rounded-2xl border border-[var(--sf-danger)] bg-[var(--sf-bg)] p-3 text-sm font-semibold text-[var(--sf-danger)]" role="alert">
          {submitError}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={onConfirm}
        loading={isSubmitting}
        disabled={!isValid || isSubmitting}
        className="mt-5 h-12 w-full rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95"
      >
        {isSubmitting ? 'Creating booking...' : 'Confirm Booking'}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </aside>
  );
}

function SummaryRow({ icon, label, value }) {
  const IconComponent = icon;

  return (
    <div className="flex gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
        <IconComponent className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--sf-text-soft)]">{label}</p>
        <p className="mt-1 text-sm font-bold leading-6 text-[var(--sf-text-main)]">{value}</p>
      </div>
    </div>
  );
}

export default BookingSummaryCard;
