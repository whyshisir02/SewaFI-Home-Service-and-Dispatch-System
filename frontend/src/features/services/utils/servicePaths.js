import { ROUTES } from '../../../constants/routes.constant';

export const serviceDetailPath = (service) => `${ROUTES.services}/${service.slug || service.id}`;

export const serviceBookPath = (service) => {
  const search = new URLSearchParams();
  search.set('serviceId', String(service.id));
  if (service?.categoryId) {
    search.set('categoryId', String(service.categoryId));
  }
  // ROUTES.customer.book declares :serviceId as optional, so drop the trailing '?' marker.
  const base = ROUTES.customer.book.replace(':serviceId?', ':serviceId').replace(':serviceId', service.id);
  return `${base}?${search.toString()}`;
};
