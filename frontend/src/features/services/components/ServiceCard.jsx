import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { Card } from '../../../components/ui/Layout/Card';
import { formatCurrency } from '../../../utils/formatCurrency';

export function ServiceCard({ service, ctaPath }) {
  return (
    <Card className="flex h-full flex-col justify-between">
      <div className="space-y-3">
        <div className="inline-flex rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">{service.category?.name || 'Home service'}</div>
        <h3 className="font-display text-2xl text-foreground">{service.name}</h3>
        <p className="text-sm text-muted">{service.description || 'Reliable professionals with clear scheduling and pricing.'}</p>
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">From</p>
          <p className="text-lg font-semibold text-foreground">{formatCurrency(service.basePrice || 0)}</p>
        </div>
        <Button as={Link} to={ctaPath || `/services/${service.id}`} variant="outline">
          Explore
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

export default ServiceCard;
