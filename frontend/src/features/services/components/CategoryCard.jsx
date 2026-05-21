import { Card } from '../../../components/ui/Layout/Card';

export function CategoryCard({ category }) {
  return (
    <Card className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{category._count?.services || 0} services</p>
      <h3 className="font-display text-2xl text-foreground">{category.name}</h3>
      <p className="text-sm text-muted">{category.description || 'Trusted specialists and transparent booking steps.'}</p>
    </Card>
  );
}

export default CategoryCard;
