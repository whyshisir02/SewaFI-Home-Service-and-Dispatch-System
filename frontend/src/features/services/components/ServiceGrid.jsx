import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { Grid } from '../../../components/ui/Layout/Grid';
import { ServiceCard } from './ServiceCard';

export function ServiceGrid({ services = [] }) {
  if (!services.length) {
    return <EmptyState title="No services found" description="Try adjusting the category or search filters." />;
  }

  return (
    <Grid className="md:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </Grid>
  );
}

export default ServiceGrid;
