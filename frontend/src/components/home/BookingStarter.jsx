import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, MapPin, ShieldCheck, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button/Button';
import { Container } from '../ui/Layout/Container';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes.constant';
import { useFeaturedServices, useHomeServiceCategories } from '../../hooks/useHomePageData';
import { appToast } from '../../lib/toast';

const bookingPath = (serviceId, params = {}) => {
  const path = ROUTES.customer.book.replace(':serviceId', serviceId);
  const search = new URLSearchParams();
  search.set('serviceId', serviceId);
  if (params.location) search.set('location', params.location);
  if (params.date) search.set('date', params.date);
  const query = search.toString();
  return query ? `${path}?${query}` : path;
};

export function BookingStarter() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const servicesQuery = useFeaturedServices();
  const categoriesQuery = useHomeServiceCategories();
  const [serviceId, setServiceId] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [validation, setValidation] = useState('');

  const serviceOptions = useMemo(() => {
    const services = servicesQuery.data || [];
    const categories = categoriesQuery.data || [];
    const fromServices = services.map((service) => ({ id: service.id, name: service.name }));

    if (fromServices.length) return fromServices;
    return categories.map((category) => ({ id: category.id, name: category.name }));
  }, [categoriesQuery.data, servicesQuery.data]);

  const isLoading = servicesQuery.isLoading || categoriesQuery.isLoading;
  const isError = servicesQuery.isError && categoriesQuery.isError;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!serviceId) {
      setValidation('Please select a service before booking.');
      appToast.error('Please select a service before booking.');
      return;
    }

    const redirectTo = bookingPath(serviceId, { location, date });
    if (!isAuthenticated) {
      navigate(`${ROUTES.login}?redirect=${encodeURIComponent(redirectTo)}`, { state: { from: redirectTo } });
      return;
    }

    navigate(redirectTo);
  };

  return (
    <section className="relative z-10 -mt-8 bg-transparent pb-12 lg:-mt-16">
      <Container>
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-6xl rounded-3xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow)] sm:p-5"
        >
          <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr_0.9fr_auto]">
            <label className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-3 text-sm font-semibold text-[var(--sf-text-main)] focus-within:border-[var(--sf-secondary)]">
              <span className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-[var(--sf-secondary)]" />
                Select Service
              </span>
              <select
                value={serviceId}
                onChange={(event) => {
                  setServiceId(event.target.value);
                  setValidation('');
                }}
                className="h-8 w-full border-none bg-transparent text-sm text-[var(--sf-text-main)] outline-none"
                disabled={isLoading || isError}
              >
                <option value="">
                  {isLoading ? 'Loading services...' : isError ? 'Unable to load services' : serviceOptions.length ? 'Choose a service' : 'No services available'}
                </option>
                {serviceOptions.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-3 text-sm font-semibold text-[var(--sf-text-main)] focus-within:border-[var(--sf-secondary)]">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--sf-secondary)]" />
                Enter Location
              </span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Customer address area"
                className="h-8 w-full border-none bg-transparent text-sm text-[var(--sf-text-main)] placeholder:text-[var(--sf-text-soft)] outline-none"
              />
            </label>

            <label className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-3 text-sm font-semibold text-[var(--sf-text-main)] focus-within:border-[var(--sf-secondary)]">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[var(--sf-secondary)]" />
                Preferred Date
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-8 w-full border-none bg-transparent text-sm text-[var(--sf-text-main)] outline-none"
              />
            </label>

            <Button
              type="submit"
              className="min-h-12 rounded-2xl bg-[var(--sf-accent)] px-7 text-white hover:brightness-95 lg:min-h-full"
              disabled={isLoading || isError || !serviceOptions.length}
            >
              Book Now
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-[var(--sf-text-muted)] sm:flex-row sm:items-center sm:justify-between">
            <span className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--sf-secondary)]" />
              Secure booking
              <span aria-hidden="true">•</span>
              Location-based dispatch
              <span aria-hidden="true">•</span>
              Verified providers
            </span>
            {validation ? (
              <span className="font-semibold text-[var(--sf-danger)]" role="alert">
                {validation}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[var(--sf-success)]">
                <CheckCircle2 className="h-4 w-4" />
                Dispatch-ready flow
              </span>
            )}
          </div>
        </form>
      </Container>
    </section>
  );
}

export default BookingStarter;