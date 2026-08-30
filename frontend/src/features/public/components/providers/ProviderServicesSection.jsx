import { Link } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button/Button';
import { ROUTES } from '../../../../constants/routes.constant';
import {
  getProviderCategoryName,
  getProviderServiceItems,
  getProviderSkills,
} from './providerProfileUtils';

const formatCurrency = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return '';

  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export function ProviderServicesSection({ provider }) {
  const categoryName = getProviderCategoryName(provider);
  const skills = getProviderSkills(provider);
  const services = getProviderServiceItems(provider);

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h2 className="text-lg font-bold text-[var(--sf-text-main)]">Services & Skills</h2>

      {categoryName ? (
        <div className="mt-4 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-text-muted)]">Service Category</p>
          <p className="mt-1 font-medium text-[var(--sf-text-main)]">{categoryName}</p>
        </div>
      ) : null}

      {skills.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={skill} className="rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-3 py-1 text-xs text-[var(--sf-text-main)]">
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      {services.length ? (
        <div className="mt-4 space-y-3">
          {services.map((service) => (
            <article key={service.id || service.name} className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
              <p className="font-semibold text-[var(--sf-text-main)]">{service.name}</p>
              {service.description ? <p className="mt-1 text-sm text-[var(--sf-text-muted)]">{service.description}</p> : null}
              {service.price != null ? <p className="mt-2 text-sm font-medium text-[var(--sf-text-main)]">{formatCurrency(service.price)}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--sf-text-muted)]">No detailed service items have been listed for this provider yet.</p>
      )}

      <div className="mt-4">
        <Button as={Link} to={ROUTES.services} variant="outline" className="rounded-xl">
          Book Related Service
        </Button>
      </div>
    </section>
  );
}

export default ProviderServicesSection;
