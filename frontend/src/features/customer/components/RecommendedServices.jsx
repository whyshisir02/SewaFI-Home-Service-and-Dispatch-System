import { ServiceGrid } from '../../services/components/ServiceGrid';

export function RecommendedServices({ services = [] }) {
  return <ServiceGrid services={services.slice(0, 3)} ctaBuilder={(service) => `/customer/book/${service.id}`} />;
}

export default RecommendedServices;
