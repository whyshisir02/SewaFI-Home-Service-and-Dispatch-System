import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constant';

export function ServiceBreadcrumb({ service }) {
  const category = service?.category;
  const categoryId = service?.categoryId || category?.id || category?.slug;

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-[var(--sf-text-muted)]">
      <Link to={ROUTES.home} className="inline-flex items-center gap-1 transition hover:text-[var(--sf-secondary)]">
        <Home className="h-4 w-4" aria-hidden="true" />
        Home
      </Link>
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
      <Link to={ROUTES.services} className="transition hover:text-[var(--sf-secondary)]">
        Services
      </Link>
      {category?.name ? (
        <>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <Link to={`${ROUTES.services}?category=${encodeURIComponent(categoryId)}`} className="transition hover:text-[var(--sf-secondary)]">
            {category.name}
          </Link>
        </>
      ) : null}
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
      <span className="font-bold text-[var(--sf-text-main)]">{service?.name || service?.title || 'Service'}</span>
    </nav>
  );
}

export default ServiceBreadcrumb;
