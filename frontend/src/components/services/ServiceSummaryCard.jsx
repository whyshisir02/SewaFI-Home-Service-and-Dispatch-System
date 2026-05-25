import { ArrowRight, CalendarCheck, Clock, DollarSign, Layers, MapPinned, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button/Button';
import { ROUTES } from '../../constants/routes.constant';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatCurrency';

const priceLabel = (service) => {
  if (service?.minPrice && service?.maxPrice) return `${formatCurrency(service.minPrice)} - ${formatCurrency(service.maxPrice)}`;
  if (service?.basePrice) return `From ${formatCurrency(service.basePrice)}`;
  return 'Estimate available during booking';
};

export function ServiceSummaryCard({ service }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const bookingPath = (() => {
    const search = new URLSearchParams();
    search.set('serviceId', String(service.id));
    if (service?.categoryId) {
      search.set('categoryId', String(service.categoryId));
    }
    return `${ROUTES.customer.book.replace(':serviceId', service.id)}?${search.toString()}`;
  })();

  const rows = [
    service?.category?.name ? { label: 'Category', value: service.category.name, icon: Layers } : null,
    service?.estimatedDuration ? { label: 'Estimated Duration', value: service.estimatedDuration, icon: Clock } : null,
    service?.availability ? { label: 'Availability', value: service.availability, icon: CalendarCheck } : null,
    service?.dispatchType ? { label: 'Dispatch Type', value: service.dispatchType, icon: MapPinned } : null,
    service?.serviceArea ? { label: 'Service Area', value: service.serviceArea, icon: MapPinned } : null,
    { label: 'Price', value: priceLabel(service), icon: DollarSign },
  ].filter(Boolean);

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate(`${ROUTES.login}?redirect=${encodeURIComponent(bookingPath)}`, { state: { from: bookingPath } });
      return;
    }

    navigate(bookingPath);
  };

  return (
    <aside className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[var(--sf-shadow)] lg:sticky lg:top-24">
      <h2 className="text-xl font-extrabold text-[var(--sf-text-main)]">Service Summary</h2>

      <div className="mt-5 space-y-4">
        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <div key={row.label} className="flex gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--sf-text-soft)]">{row.label}</p>
                <p className="mt-1 font-bold text-[var(--sf-text-main)]">{row.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Button type="button" onClick={handleBook} className="mt-6 h-12 w-full rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95">
        Book This Service
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button as={Link} to={ROUTES.contact} variant="outline" className="mt-3 h-12 w-full rounded-xl">
        Contact Support
      </Button>
      <p className="mt-3 text-xs text-[var(--sf-text-muted)]">
        Final price may vary after site inspection and customer confirmation.
      </p>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm font-semibold text-[var(--sf-text-muted)]">
        <ShieldCheck className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
        Secure booking and location-based dispatch
      </p>
    </aside>
  );
}

export default ServiceSummaryCard;
