import { Card } from '../ui/Layout/Card';

export function ChartCard({ title, description, children }) {
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
      <div className="h-[260px]">{children}</div>
    </Card>
  );
}

export default ChartCard;
